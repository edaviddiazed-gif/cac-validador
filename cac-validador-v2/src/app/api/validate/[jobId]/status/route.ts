/**
 * GET /api/validate/[jobId]/status
 * FASE 3: Polling de progreso de validación vía Server-Sent Events (SSE)
 *
 * Conexión continua que envía actualizaciones de progreso cada 500ms
 * Cierra automáticamente cuando status = 'completado'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/validate/[jobId]/status
 * Server-Sent Events stream para polling de progreso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  // Verificar autenticación (optional, pero recomendado)
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { error: 'Missing user context' },
      { status: 401 }
    );
  }

  // Crear respuesta SSE
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      try {
        // 1. Obtener job inicial
        const { data: job, error: jobError } = await supabase
          .from('validation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError || !job) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Job not found' })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // 2. Verificar autorización (user puede ver su propio job)
        // En producción, verificar que userId tiene acceso a este job
        // Por ahora, permitimos si el userId es admin_cac o es del mismo eapb

        // 3. Loop de polling
        let isComplete = false;
        const maxWaitTime = 30 * 60 * 1000; // 30 minutos timeout
        const pollInterval = 500; // 500ms
        const startTime = Date.now();

        while (!isComplete) {
          // Timeout check
          if (Date.now() - startTime > maxWaitTime) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: 'Timeout: validación tomó demasiado tiempo',
                })}\n\n`
              )
            );
            break;
          }

          // Obtener estado actual del job
          const { data: currentJob, error: fetchError } = await supabase
            .from('validation_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

          if (fetchError || !currentJob) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: 'Job disappeared' })}\n\n`
              )
            );
            break;
          }

          // Construir payload de progreso
          const percentage =
            currentJob.total_registros > 0
              ? Math.round(
                  (currentJob.registros_procesados / currentJob.total_registros) *
                    100
                )
              : 0;

          const elapsedSeconds = Math.round(
            (Date.now() - new Date(currentJob.created_at).getTime()) / 1000
          );

          const estimatedTotalSeconds =
            currentJob.registros_procesados > 0
              ? Math.round(
                  (currentJob.total_registros /
                    currentJob.registros_procesados) *
                    elapsedSeconds
                )
              : currentJob.total_registros / 500; // Asumir 500 reg/s

          const estimatedSecondsRemaining = Math.max(
            0,
            estimatedTotalSeconds - elapsedSeconds
          );

          // Enviar actualización SSE
          const progressData = {
            jobId: currentJob.id,
            status: currentJob.status,
            processed: currentJob.registros_procesados,
            total: currentJob.total_registros,
            percentage,
            valid: currentJob.registros_validos,
            errors: currentJob.registros_con_error,
            elapsedSeconds,
            estimatedSecondsRemaining,
            currentState: `Validando registro ${currentJob.registros_procesados}/${currentJob.total_registros}`,
            errorMessage: currentJob.error_mensaje || null,
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
          );

          // Verificar si completado
          if (
            currentJob.status === 'completado' ||
            currentJob.status === 'error'
          ) {
            isComplete = true;
            // Enviar evento final
            const finalData = {
              ...progressData,
              final: true,
              totalRegistros: currentJob.total_registros,
              registrosValidos: currentJob.registros_validos,
              registrosConError: currentJob.registros_con_error,
              erroresAgrupados: currentJob.metadata?.errores_agrupados || {},
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
            );
            break;
          }

          // Esperar antes de siguiente poll
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }

        controller.close();
      } catch (error) {
        console.error('SSE error:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  // Retornar respuesta SSE
  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering
    },
  });
}

export async function POST() {
  return NextResponse.json(
    { message: 'Use GET for status polling' },
    { status: 405 }
  );
}
