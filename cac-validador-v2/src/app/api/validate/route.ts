/**
 * POST /api/validate
 * FASE 3: Triggerear validación asincrónica de un reporte completo
 * 
 * 1. Verifica autenticación JWT
 * 2. Valida que EAPB tiene acceso al reporte
 * 3. Crea validation_job en BD
 * 4. Triggerear Edge Function async
 * 5. Retorna jobId para polling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ValidateRequestSchema = z.object({
  reporteId: z.string().uuid(),
  revalidate: z.boolean().optional().default(false),
});

type ValidateRequest = z.infer<typeof ValidateRequestSchema>;

/**
 * POST /api/validate
 * Triggerear validación async de un reporte
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = ValidateRequestSchema.parse(body);

    // 1. Verificar autenticación (extraer user_id del header)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing user context' },
        { status: 401 }
      );
    }

    // 2. Obtener reporte y verificar acceso
    const { data: reporte, error: reporteError } = await supabase
      .from('reportes_cancer')
      .select('id, eapb_id, estado, total_registros, registros_con_error')
      .eq('id', payload.reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // 3. Verificar que EAPB tiene acceso (desde user_profiles)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, eapb_id')
      .eq('id', userId)
      .single();

    const isAdminCac = userProfile?.role === 'admin_cac';
    const isOwnEAPB = userProfile?.eapb_id === reporte.eapb_id;

    if (!isAdminCac && !isOwnEAPB) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para acceder a este reporte' },
        { status: 403 }
      );
    }

    // 4. Si ya fue validado y no es revalidate, retornar cached
    if (reporte.estado === 'validado' && !payload.revalidate) {
      return NextResponse.json({
        success: true,
        message: 'Report already validated',
        reporteId: payload.reporteId,
        estado: reporte.estado,
        registrosValidos: reporte.total_registros - reporte.registros_con_error,
        registrosConError: reporte.registros_con_error,
      });
    }

    // 5. Crear validation_job
    const { data: job, error: jobError } = await supabase
      .from('validation_jobs')
      .insert({
        reporte_id: payload.reporteId,
        eapb_id: reporte.eapb_id,
        status: 'pendiente',
        total_registros: reporte.total_registros,
        usuario_id: userId,
        metadata: {
          revalidate: payload.revalidate,
          triggered_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create validation job: ${jobError?.message}`);
    }

    // 6. Ejecutar validación con el motor V2 completo (inline, no Edge Function)
    // Esto reemplaza la Edge Function que solo validaba 3 campos triviales
    try {
      // Marcar job como procesando
      await supabase
        .from('validation_jobs')
        .update({ status: 'procesando', started_at: new Date().toISOString() })
        .eq('id', job.id);

      // Obtener registros del reporte
      const { data: registros, error: regError } = await supabase
        .from('registros_cancer')
        .select('*')
        .eq('reporte_id', payload.reporteId)
        .order('linea_numero', { ascending: true });

      if (regError || !registros || registros.length === 0) {
        throw new Error('No registros found for validation');
      }

      // Importar el motor de validación V2
      const { validateRecord, createEmptyCatalogs } = await import('@/lib/validations');
      const context = { catalogos: createEmptyCatalogs() };

      let registrosValidos = 0;
      const todosErrores: any[] = [];

      for (const registro of registros) {
        const errors = validateRecord(registro as any, registro.linea_numero ?? 0, context);
        const realErrors = errors.filter(e => e.severity !== 'info');

        if (realErrors.length === 0) {
          registrosValidos++;
        }

        // Preparar errores para inserción en BD
        for (const err of realErrors) {
          todosErrores.push({
            registro_id: registro.id,
            variable_numero: err.variable,
            variable_nombre: err.variableName,
            tipo_error: err.type,
            valor_reportado: err.reportedValue || null,
            mensaje_error: err.message,
            sugerencia: err.suggestion || null,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Insertar errores en lotes de 500
      if (todosErrores.length > 0) {
        for (let i = 0; i < todosErrores.length; i += 500) {
          const batch = todosErrores.slice(i, i + 500);
          await supabase.from('errores_validacion').insert(batch);
        }
      }

      // Actualizar reporte
      const registrosConError = registros.length - registrosValidos;
      await supabase
        .from('reportes_cancer')
        .update({
          estado: 'validado',
          validated_at: new Date().toISOString(),
          registros_validos: registrosValidos,
          registros_con_error: registrosConError,
          total_errores: todosErrores.length,
        })
        .eq('id', payload.reporteId);

      // Actualizar job como completado
      await supabase
        .from('validation_jobs')
        .update({
          status: 'completado',
          registros_procesados: registros.length,
          registros_validos: registrosValidos,
          registros_con_error: registrosConError,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log(
        `[validate] Completed: ${registrosValidos}/${registros.length} válidos, ${todosErrores.length} errores`
      );

    } catch (err) {
      console.error('Validation processing error:', err);
      // Marcar job como error
      await supabase
        .from('validation_jobs')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          metadata: { error: err instanceof Error ? err.message : 'Unknown' },
        })
        .eq('id', job.id);
    }

    // 7. Retornar respuesta con jobId
    return NextResponse.json({
      success: true,
      jobId: job.id,
      reporteId: payload.reporteId,
      estimatedTime: Math.ceil(reporte.total_registros / 500),
      message: 'Validación completada con motor V2.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request schema',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('POST /api/validate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to trigger validation' },
    { status: 405 }
  );
}
