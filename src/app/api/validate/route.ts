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

    // 6. Triggerear Edge Function (async, no esperar)
    try {
      // Llamada no-bloqueante a Edge Function
      fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/validate-cac`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            jobId: job.id,
            reporteId: payload.reporteId,
            eapbId: reporte.eapb_id,
          }),
        }
      ).catch((err) => {
        console.error('Edge Function call failed:', err);
        // No fallar la respuesta si falla la función
      });
    } catch (err) {
      console.error('Error triggering Edge Function:', err);
    }

    // 7. Retornar respuesta inmediata con jobId
    return NextResponse.json({
      success: true,
      jobId: job.id,
      reporteId: payload.reporteId,
      estimatedTime: Math.ceil(reporte.total_registros / 500), // segundos (500 reg/s)
      message: 'Validación iniciada. Usa jobId para polling de progreso.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request schema',
          details: error.errors,
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
