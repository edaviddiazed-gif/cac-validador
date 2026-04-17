import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ExportTxtSchema = z.object({
  reporteId: z.string().uuid(),
  onlyValid: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const payload = ExportTxtSchema.parse(await request.json());

    // 1. Verificar existencia del reporte y extraer EAPB
    const { data: reporte, error: reporteError } = await supabase
      .from('reportes_cancer')
      .select('eapb_id, periodo_corte, eapb!inner(codigo)')
      .eq('id', payload.reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json({ success: false, error: 'Reporte no encontrado' }, { status: 404 });
    }

    // TODO (Fase 4): Obtener registros (filtrados si onlyValid=true) usando reporteId
    // TODO (Fase 4): Convertir a TXT ANSI con iconv-lite
    // TODO (Fase 4): Validar que el archivo parseado resultante tenga 0 errores.
    
    // Placeholder payload
    const dummyTxtData = "V1\\tV2\\tV3\\r\\nData1\\tData2\\tData3";
    const eapbCodigo = reporte.eapb?.codigo || 'XXXXX0';
    const periodStr = reporte.periodo_corte.replace(/-/g, '').substring(0, 8); // YYYYMMDD
    const filename = `${periodStr}_${eapbCodigo}_CANCER.txt`;

    return new NextResponse(dummyTxtData, {
      headers: {
        'Content-Type': 'text/plain; charset=windows-1252',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error generating TXT' }, { status: 500 });
  }
}
