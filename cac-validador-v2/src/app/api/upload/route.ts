/**
 * POST /api/upload
 * Procesa carga de archivo TXT CAC
 * 1. Valida formato del archivo
 * 2. Parsea registros
 * 3. Almacena en Supabase
 * 4. Retorna ID del reporte para tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseCAC } from '@/lib/parsers/cac-parser';
import { validateFilename } from '@/lib/parsers/filename-validator';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/security/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UploadRequestSchema = z.object({
  fileName: z.string().min(1),
  fileContent: z.string().min(1),
  periodCorte: z.string().date(),
  eapbId: z.string().uuid(),
});

type UploadRequest = z.infer<typeof UploadRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = UploadRequestSchema.parse(body);

    // 1. Validar nombre de archivo
    const filenameValidation = validateFilename(payload.fileName);
    if (!filenameValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filename format',
          details: filenameValidation.error ? [filenameValidation.error] : [],
        },
        { status: 400 }
      );
    }

    // 1.5. Rate Limiting por EAPB
    const rateLimit = await checkRateLimit(payload.eapbId);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Maximum 10 uploads per hour.',
        },
        { status: 429, headers: { 'X-RateLimit-Reset': rateLimit.reset.toISOString() } }
      );
    }

    // 2. Parsear contenido del archivo
    const parseResult = parseCAC(payload.fileContent, payload.fileName);
    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse file',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // 3. Crear reporte en BD
    const { data: reporte, error: reporteError } = await supabase
      .from('reportes_cancer')
      .insert({
        eapb_id: payload.eapbId,
        periodo_corte: payload.periodCorte,
        nombre_archivo: payload.fileName,
        total_registros: parseResult.records.length,
        estado: 'validando',
        archivo_storage_path: `uploads/${payload.eapbId}/${Date.now()}_${payload.fileName}`,
      })
      .select()
      .single();

    if (reporteError) {
      throw new Error(`Database error: ${reporteError.message}`);
    }

    // 4. Insertar registros individuales
    const registrosData = parseResult.records.map((record, idx) => ({
      reporte_id: reporte.id,
      linea_numero: idx + 1,
      raw_data: record,
      // Las 134 variables se mapean individualmente (mapFieldsToRecord)
      ...mapRecordToVariables(record),
    }));

    const { error: registrosError } = await supabase
      .from('registros_cancer')
      .insert(registrosData);

    if (registrosError) {
      throw new Error(`Insert registros error: ${registrosError.message}`);
    }

    // 5. Retornar ID del reporte para tracking
    return NextResponse.json({
      success: true,
      reporteId: reporte.id,
      totalRegistros: parseResult.records.length,
      message: 'File uploaded successfully. Validation in progress...',
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

    console.error('Upload error:', error);
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
 * Mapear registro parseado a estructura de BD
 * Temporal: mapeo simple de propiedades disponibles
 */
function mapRecordToVariables(record: any) {
  return {
    v01_primer_nombre: record.v01 || null,
    v02_segundo_nombre: record.v02 || null,
    v03_primer_apellido: record.v03 || null,
    v04_segundo_apellido: record.v04 || null,
    v05_tipo_id: record.v05 || null,
    v06_numero_id: record.v06 || null,
    v07_fecha_nacimiento: record.v07 || null,
    v08_sexo: record.v08 || null,
    v09_ocupacion: record.v09 || null,
    v10_regimen: record.v10 || null,
    v11_codigo_eapb: record.v11 || null,
    v12_pertenencia_etnica: record.v12 || null,
    v13_grupo_poblacional: record.v13 || null,
    v14_municipio_residencia: record.v14 || null,
    v15_telefono: record.v15 || null,
    v16_fecha_afiliacion: record.v16 || null,
    v17_cie10: record.v17 || null,
    v18_fecha_diagnostico: record.v18 || null,
    v128_novedad_admin: record.v128 || null,
    v134_fecha_corte: record.v134 || null,
    // ... mapeo de todas las 134 variables
  };
}

export async function GET() {
  return NextResponse.json(
    { message: 'POST endpoint for file upload' },
    { status: 405 }
  );
}
