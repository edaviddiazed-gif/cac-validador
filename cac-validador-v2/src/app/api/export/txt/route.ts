/**
 * POST /api/export/txt
 * Genera archivo TXT ANSI con separador pipe para envío a SISCAC.
 *
 * Flujo:
 * 1. Verificar autenticación y acceso al reporte
 * 2. Obtener registros de BD (filtrar solo válidos si onlyValid=true)
 * 3. Generar TXT usando txt-exporter
 * 4. Retornar archivo con Content-Disposition
 *
 * @module app/api/export/txt/route
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { txtExporter } from "@/lib/exporters/txt-exporter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ExportTxtSchema = z.object({
  reporteId: z.string().uuid(),
  onlyValid: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const payload = ExportTxtSchema.parse(await request.json());

    // 1. Verificar autenticación
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing authentication" },
        { status: 401 },
      );
    }

    // 2. Verificar existencia del reporte y acceso
    const { data: reporte, error: reporteError } = await supabase
      .from("reportes_cancer")
      .select("id, eapb_id, periodo_corte, estado, eapb:eapb_id ( codigo )")
      .eq("id", payload.reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json(
        { success: false, error: "Reporte no encontrado" },
        { status: 404 },
      );
    }

    // 3. Verificar permisos
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, eapb_id")
      .eq("user_id", userId)
      .single();

    const isAdmin = profile?.role === "admin_cac" || profile?.role === "admin";
    const isOwnEAPB = profile?.eapb_id === reporte.eapb_id;

    if (!isAdmin && !isOwnEAPB) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 },
      );
    }

    // 4. Obtener registros
    let query = supabase
      .from("registros_cancer")
      .select("*")
      .eq("reporte_id", payload.reporteId)
      .order("linea_numero", { ascending: true });

    const { data: registros, error: registrosError } = await query;

    if (registrosError || !registros || registros.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontraron registros para exportar" },
        { status: 400 },
      );
    }

    // 5. Si onlyValid, filtrar registros sin errores
    let registrosParaExportar = registros;
    if (payload.onlyValid) {
      const registroIds = registros.map((r: any) => r.id);
      const { data: errores } = await supabase
        .from("errores_validacion")
        .select("registro_id")
        .in("registro_id", registroIds);

      const idsConError = new Set(
        (errores ?? []).map((e: any) => e.registro_id),
      );
      registrosParaExportar = registros.filter(
        (r: any) => !idsConError.has(r.id),
      );
    }

    // 6. Generar TXT usando el exporter existente
    const eapbCodigo =
      (reporte.eapb as any)?.codigo ?? "XXXXX0";

    const result = await txtExporter.export(
      registrosParaExportar,
      eapbCodigo,
      { onlyValid: payload.onlyValid },
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.validationErrors?.join("; ") ??
            "Error generando archivo TXT",
        },
        { status: 400 },
      );
    }

    // 7. Construir nombre de archivo
    const periodStr = (reporte.periodo_corte ?? "")
      .replace(/-/g, "")
      .substring(0, 8);
    const filename = `${periodStr}_${eapbCodigo}_CANCER.txt`;

    // 8. Retornar archivo con encoding Windows-1252
    return new NextResponse(result.fileContent, {
      headers: {
        "Content-Type": "text/plain; charset=windows-1252",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Total-Registros": String(registrosParaExportar.length),
        "X-Registros-Originales": String(registros.length),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request schema", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[/api/export/txt] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error generating TXT",
      },
      { status: 500 },
    );
  }
}
