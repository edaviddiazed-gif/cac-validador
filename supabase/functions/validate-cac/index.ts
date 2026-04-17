/**
 * Edge Function: validate-cac
 * FASE 3: Validación asincrónica de reportes CAC
 * 
 * Triggerada desde POST /api/validate
 * Executa en Deno (Serverless Function en Supabase)
 * 
 * Flujo:
 * 1. Recibir jobId, reporteId, eapbId
 * 2. Marcar job como "procesando"
 * 3. Obtener registros de BD
 * 4. Validar cada registro (lógica básica)
 * 5. Insertar errores encontrados
 * 6. Actualizar job como "completado"
 * 7. Notificar via Realtime
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Manejo CORS (preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { jobId, reporteId, eapbId } = await req.json();

    if (!jobId || !reporteId) {
      return new Response(
        JSON.stringify({ error: "Missing jobId or reporteId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // 1. Marcar job como "procesando"
    console.log(
      `[validate-cac] Starting validation for job ${jobId}, reporte ${reporteId}`
    );

    await supabase
      .from("validation_jobs")
      .update({
        status: "procesando",
        started_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // 2. Obtener todos los registros del reporte
    const { data: registros, error: registrosError } = await supabase
      .from("registros_cancer")
      .select("*")
      .eq("reporte_id", reporteId)
      .order("linea_numero", { ascending: true });

    if (registrosError) {
      throw new Error(
        `Failed to fetch registros: ${registrosError.message}`
      );
    }

    if (!registros || registros.length === 0) {
      await supabase
        .from("validation_jobs")
        .update({
          status: "completado",
          registros_procesados: 0,
          registros_validos: 0,
          registros_con_error: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "No registros found",
          jobId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // 3. Validar cada registro
    const totalRegistros = registros.length;
    let registrosValidos = 0;
    let erroresEncontrados: any[] = [];
    const batchSize = 100; // Procesar en lotes para no sobrecargar

    for (let i = 0; i < totalRegistros; i += batchSize) {
      const batch = registros.slice(i, i + batchSize);

      for (const registro of batch) {
        const recordErrors = validateRecord(registro);

        if (recordErrors.length === 0) {
          registrosValidos++;
        } else {
          erroresEncontrados.push(...recordErrors);
        }

        // Actualizar progreso en job
        const processed = i + batch.indexOf(registro) + 1;
        if (processed % 50 === 0) {
          // Actualizar cada 50 registros para no saturar BD
          await supabase
            .from("validation_jobs")
            .update({
              registros_procesados: processed,
              registros_validos: registrosValidos,
              registros_con_error: Math.max(
                0,
                erroresEncontrados.length
              ),
            })
            .eq("id", jobId);
        }
      }

      console.log(
        `[validate-cac] Processed ${Math.min(i + batchSize, totalRegistros)}/${totalRegistros}`
      );
    }

    // 4. Insertar errores en BD (en lotes)
    if (erroresEncontrados.length > 0) {
      const errorBatchSize = 500;

      for (let i = 0; i < erroresEncontrados.length; i += errorBatchSize) {
        const errorBatch = erroresEncontrados.slice(
          i,
          i + errorBatchSize
        );

        const { error: insertError } = await supabase
          .from("errores_validacion")
          .insert(errorBatch);

        if (insertError) {
          console.error(
            `Error inserting batch ${i / errorBatchSize}:`,
            insertError
          );
        }
      }

      console.log(
        `[validate-cac] Inserted ${erroresEncontrados.length} errores`
      );
    }

    // 5. Actualizar estado del reporte
    const { error: updateError } = await supabase
      .from("reportes_cancer")
      .update({
        estado: erroresEncontrados.length === 0 ? "validado" : "validado", // Siempre validado aunque tenga errores
        validated_at: new Date().toISOString(),
        registros_validos: registrosValidos,
        registros_con_error: totalRegistros - registrosValidos,
        metadata: {
          validacion_timestamp: new Date().toISOString(),
          total_errores: erroresEncontrados.length,
        },
      })
      .eq("id", reporteId);

    if (updateError) {
      console.error(
        "Error updating reporte estado:",
        updateError
      );
    }

    // 6. Actualizar job como completado
    const { error: completeError } = await supabase
      .from("validation_jobs")
      .update({
        status: "completado",
        registros_procesados: totalRegistros,
        registros_validos: registrosValidos,
        registros_con_error: totalRegistros - registrosValidos,
        completed_at: new Date().toISOString(),
        metadata: {
          errores_por_tipo: agruparErroresPorTipo(erroresEncontrados),
          validacion_completada: true,
        },
      })
      .eq("id", jobId);

    if (completeError) {
      console.error("Error completing job:", completeError);
    }

    console.log(
      `[validate-cac] Completed validation job ${jobId}. Válidos: ${registrosValidos}/${totalRegistros}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        reporteId,
        totalRegistros,
        registrosValidos,
        registrosConError: totalRegistros - registrosValidos,
        erroresEncontrados: erroresEncontrados.length,
        message: "Validación completada",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[validate-cac] Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Validación básica de registro
 * Retorna array de errores encontrados (empty si válido)
 */
function validateRecord(registro: any): any[] {
  const errores: any[] = [];

  // Validar campos requeridos básicos
  const camposRequeridos = [
    "v06_numero_id",
    "v17_cie10",
    "v18_fecha_diagnostico",
  ];

  for (const campo of camposRequeridos) {
    if (!registro[campo]) {
      errores.push({
        registro_id: registro.id,
        variable_numero: parseInt(campo.replace("v", "").split("_")[0]),
        variable_nombre: campo,
        tipo_error: "requerido",
        valor_reportado: null,
        mensaje_error: `Campo ${campo} es requerido`,
        sugerencia: `Proporcionar valor para ${campo}`,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Validar formato de fechas (básico)
  if (
    registro.v18_fecha_diagnostico &&
    !isValidDate(registro.v18_fecha_diagnostico)
  ) {
    errores.push({
      registro_id: registro.id,
      variable_numero: 18,
      variable_nombre: "v18_fecha_diagnostico",
      tipo_error: "formato",
      valor_reportado: registro.v18_fecha_diagnostico,
      mensaje_error: "Fecha diagnóstico tiene formato inválido",
      sugerencia: "Usar formato YYYY-MM-DD",
      created_at: new Date().toISOString(),
    });
  }

  // Validar CIE-10 (básico: debe tener formato C##)
  if (
    registro.v17_cie10 &&
    !/^[A-Z]\d{2}/.test(registro.v17_cie10)
  ) {
    errores.push({
      registro_id: registro.id,
      variable_numero: 17,
      variable_nombre: "v17_cie10",
      tipo_error: "formato",
      valor_reportado: registro.v17_cie10,
      mensaje_error: "CIE-10 tiene formato inválido",
      sugerencia: "Usar código CIE-10 válido (ej: C50, C61)",
      created_at: new Date().toISOString(),
    });
  }

  return errores;
}

/**
 * Validar si string es una fecha válida
 */
function isValidDate(dateString: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Agrupar errores por tipo para metadata
 */
function agruparErroresPorTipo(errores: any[]): Record<string, number> {
  const agrupados: Record<string, number> = {};

  for (const error of errores) {
    const tipo = error.tipo_error || "unknown";
    agrupados[tipo] = (agrupados[tipo] || 0) + 1;
  }

  return agrupados;
}
