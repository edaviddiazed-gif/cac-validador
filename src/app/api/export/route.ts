/**
 * POST /api/export
 * FASE 4: Exporta reporte en múltiples formatos (TXT ANSI, PDF, Excel)
 * 
 * FASE 4A: POST /api/export/txt → TXT ANSI para SISCAC
 * FASE 4B: POST /api/export/report?format=pdf → PDF ejecutivo
 * FASE 4C: POST /api/export/report?format=excel → Excel con múltiples hojas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { txtExporter } from '@/lib/exporters/txt-exporter';
import { pdfReporter } from '@/lib/exporters/pdf-reporter';
import { excelExporter } from '@/lib/exporters/excel-exporter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ExportRequestSchema = z.object({
  reporteId: z.string().uuid(),
  format: z.enum(['txt', 'pdf', 'excel']).default('txt'),
  onlyValid: z.boolean().optional().default(false),
});

type ExportRequest = z.infer<typeof ExportRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = ExportRequestSchema.parse(body);

    // 1. Verificar autenticación
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication' },
        { status: 401 }
      );
    }

    // 2. Obtener reporte y verificar acceso
    const { data: reporte, error: reporteError } = await supabase
      .from('reportes_cancer')
      .select('*')
      .eq('id', payload.reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // 3. Verificar acceso (EAPB own data)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, eapb_id')
      .eq('id', userId)
      .single();

    const isAdminCac = userProfile?.role === 'admin_cac';
    const isOwnEAPB = userProfile?.eapb_id === reporte.eapb_id;

    if (!isAdminCac && !isOwnEAPB) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // 4. Obtener datos para exportación
    const { data: registros } = await supabase
      .from('registros_cancer')
      .select('*')
      .eq('reporte_id', payload.reporteId);

    const { data: errores } = await supabase
      .from('errores_validacion')
      .select('*')
      .in('registro_id', registros?.map((r: any) => r.id) || []);

    const { data: eapb } = await supabase
      .from('eapb')
      .select('nombre, codigo')
      .eq('id', reporte.eapb_id)
      .single();

    if (!registros || registros.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No registros found' },
        { status: 400 }
      );
    }

    // 5. Exportar según formato
    let result;

    switch (payload.format) {
      case 'txt':
        result = await txtExporter.export(registros, eapb?.codigo || '0001', {
          onlyValid: payload.onlyValid,
        });
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.validationErrors?.join('; ') },
            { status: 400 }
          );
        }

        // Guardar en Storage y retornar URL
        return await exportToStorage(
          result.fileContent,
          result.fileName,
          'text/plain',
          reporte.eapb_id
        );

      case 'pdf':
        result = await pdfReporter.generate({
          eapbNombre: eapb?.nombre || 'Desconocida',
          eapbCodigo: eapb?.codigo || '0001',
          periodCorte: new Date(reporte.periodo_corte),
          totalRegistros: reporte.total_registros,
          registrosValidos: reporte.registros_validos,
          registrosConError: reporte.registros_con_error,
          errores: errores || [],
        });

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 }
          );
        }

        return await exportToStorage(
          Buffer.from(result.pdfBytes!),
          result.fileName,
          'application/pdf',
          reporte.eapb_id
        );

      case 'excel':
        result = await excelExporter.generate({
          eapbNombre: eapb?.nombre || 'Desconocida',
          eapbCodigo: eapb?.codigo || '0001',
          periodCorte: new Date(reporte.periodo_corte),
          totalRegistros: reporte.total_registros,
          registrosValidos: reporte.registros_validos,
          registrosConError: reporte.registros_con_error,
          registros: registros,
          errores: errores || [],
        });

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 }
          );
        }

        return await exportToStorage(
          Buffer.from(result.excelBytes!),
          result.fileName,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          reporte.eapb_id
        );

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid format' },
          { status: 400 }
        );
    }
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

    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Guardar archivo en Supabase Storage y retornar signed URL
 */
async function exportToStorage(
  fileContent: Buffer | string,
  fileName: string,
  mimeType: string,
  eapbId: string
) {
  try {
    const filePath = `exports/${eapbId}/${Date.now()}_${fileName}`;

    // Convertir a Buffer si es string
    const buffer = typeof fileContent === 'string'
      ? Buffer.from(fileContent, 'utf-8')
      : fileContent;

    // Subir a Storage
    const { data, error } = await supabase.storage
      .from('reportes')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Obtener signed URL válida por 1 hora
    const { data: signedUrl } = await supabase.storage
      .from('reportes')
      .createSignedUrl(filePath, 3600); // 1 hora

    if (!signedUrl) {
      throw new Error('Failed to create signed URL');
    }

    return NextResponse.json({
      success: true,
      fileName,
      fileSize: buffer.byteLength,
      downloadUrl: signedUrl.signedUrl,
      expiresIn: 3600,
      message: 'Archivo generado y listo para descargar',
    });
  } catch (error) {
    console.error('Storage error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'POST endpoint for export' },
    { status: 405 }
  );
}
