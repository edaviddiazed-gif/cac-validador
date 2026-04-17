/**
 * ExcelExporter
 * FASE 4C: Generar Excel con múltiples hojas
 * 
 * Hojas:
 * 1. Resumen: KPIs y gráficos
 * 2. Errores: Lista plana filtrable
 * 3. Por Variable: Pivot de errores
 * 4. Por Paciente: Agrupado por DNI
 * 5. Registros Válidos: Verde, listos para SISCAC
 * 6. Registros con Error: Rojo, necesitan corrección
 * 
 * Colores:
 * - Errores críticos: rojo (#FFE0E0)
 * - Advertencias: amarillo (#FFFACD)
 * - Correctos: verde (#E0FFE0)
 */

interface ExcelExportResult {
  success: boolean;
  excelBytes?: Uint8Array;
  fileName: string;
  fileSize: number;
  error?: string;
}

export class ExcelExporter {
  /**
   * Generar Excel con múltiples hojas
   */
  async generate(reporteData: {
    eapbNombre: string;
    eapbCodigo: string;
    periodCorte: Date;
    totalRegistros: number;
    registrosValidos: number;
    registrosConError: number;
    registros: any[];
    errores: any[];
  }): Promise<ExcelExportResult> {
    try {
      // Importar XLSX dinámicamente
      const XLSX = await import('xlsx');

      // Crear workbook
      const wb = XLSX.utils.book_new();

      // Agregar hojas
      const summarySheet = this.createSummarySheet(reporteData);
      const errorsSheet = this.createErrorsSheet(reporteData.errores);
      const byVariableSheet = this.createByVariableSheet(reporteData.errores);
      const byPatientSheet = this.createByPatientSheet(
        reporteData.registros,
        reporteData.errores
      );
      const validRecordsSheet = this.createValidRecordsSheet(
        reporteData.registros
      );
      const invalidRecordsSheet = this.createInvalidRecordsSheet(
        reporteData.registros,
        reporteData.errores
      );

      XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');
      XLSX.utils.book_append_sheet(wb, errorsSheet, 'Errores');
      XLSX.utils.book_append_sheet(wb, byVariableSheet, 'Por Variable');
      XLSX.utils.book_append_sheet(wb, byPatientSheet, 'Por Paciente');
      XLSX.utils.book_append_sheet(wb, validRecordsSheet, 'Válidos');
      XLSX.utils.book_append_sheet(wb, invalidRecordsSheet, 'Con Error');

      // Generar bytes
      const excelBytes = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'array',
      }) as Uint8Array;

      const fileName = this.generateFileName(reporteData.eapbCodigo);

      return {
        success: true,
        excelBytes,
        fileName,
        fileSize: excelBytes.byteLength,
      };
    } catch (error) {
      return {
        success: false,
        fileName: '',
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Hoja 1: Resumen
   */
  private createSummarySheet(reporteData: any): any {
    const XLSX = require('xlsx');

    const data = [
      ['RESUMEN EJECUTIVO'],
      [],
      ['EAPB', reporteData.eapbNombre],
      ['Período', this.formatDate(reporteData.periodCorte)],
      [],
      ['MÉTRICAS', 'VALOR', '%'],
      [
        'Total Registros',
        reporteData.totalRegistros,
        '100%',
      ],
      [
        'Registros Válidos',
        reporteData.registrosValidos,
        `${Math.round(
          (reporteData.registrosValidos / reporteData.totalRegistros) * 100
        )}%`,
      ],
      [
        'Registros con Error',
        reporteData.registrosConError,
        `${Math.round(
          (reporteData.registrosConError / reporteData.totalRegistros) * 100
        )}%`,
      ],
      [
        'Tasa de Calidad',
        `${Math.round(
          (reporteData.registrosValidos / reporteData.totalRegistros) * 100
        )}%`,
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Establecer anchos de columna
    ws['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
    ];

    // Estilos (básicos en XLSX)
    return ws;
  }

  /**
   * Hoja 2: Errores
   */
  private createErrorsSheet(errores: any[]): any {
    const XLSX = require('xlsx');

    const data = [
      ['Registro', 'Variable', 'Tipo Error', 'Valor', 'Mensaje', 'Sugerencia'],
      ...errores.map((e) => [
        e.registro_id?.substring(0, 8) || '',
        e.variable_numero,
        e.tipo_error,
        e.valor_reportado || '',
        e.mensaje_error || '',
        e.sugerencia || '',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos
    ws['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
    ];

    return ws;
  }

  /**
   * Hoja 3: Por Variable
   */
  private createByVariableSheet(errores: any[]): any {
    const XLSX = require('xlsx');

    // Agrupar errores por variable
    const grouped: Record<number, number> = {};

    for (const error of errores) {
      const varNum = error.variable_numero;
      grouped[varNum] = (grouped[varNum] || 0) + 1;
    }

    const data = [
      ['Variable', 'Total Errores', '%'],
      ...Object.entries(grouped)
        .map(([variable, count]) => [
          variable,
          count,
          `${((count as number / errores.length) * 100).toFixed(1)}%`,
        ])
        .sort((a, b) => (b[1] as number) - (a[1] as number)),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos
    ws['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ];

    return ws;
  }

  /**
   * Hoja 4: Por Paciente
   */
  private createByPatientSheet(registros: any[], errores: any[]): any {
    const XLSX = require('xlsx');

    // Agrupar errores por paciente (DNI)
    const grouped: Record<
      string,
      { nombre: string; errorCount: number; variables: Set<number> }
    > = {};

    for (const error of errores) {
      const registroId = error.registro_id;
      if (!grouped[registroId]) {
        const registro = registros.find((r) => r.id === registroId);
        grouped[registroId] = {
          nombre: `${registro?.v01_primer_nombre || ''} ${registro?.v03_primer_apellido || ''}`,
          errorCount: 0,
          variables: new Set(),
        };
      }
      grouped[registroId].errorCount++;
      grouped[registroId].variables.add(error.variable_numero);
    }

    const data = [
      ['DNI', 'Nombre', 'Variables con Error', 'Total Errores'],
      ...Object.entries(grouped)
        .map(([dni, info]) => [
          dni.substring(0, 8),
          info.nombre,
          Array.from(info.variables).join(', '),
          info.errorCount,
        ])
        .slice(0, 100), // Limitar a 100 pacientes
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos
    ws['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
    ];

    return ws;
  }

  /**
   * Hoja 5: Registros Válidos
   */
  private createValidRecordsSheet(registros: any[]): any {
    const XLSX = require('xlsx');

    const validRegistros = registros.filter(
      (r) => !r.tiene_error || r.errores?.length === 0
    );

    if (validRegistros.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([
        ['No hay registros válidos'],
      ]);
      return ws;
    }

    // Obtener primeros 168 campos (v01 a v168)
    const headers = Array.from({ length: 168 }, (_, i) =>
      `v${String(i + 1).padStart(2, '0')}`
    );

    const data = [
      headers,
      ...validRegistros.map((r) =>
        headers.map((h) => r[h] || '')
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos mínimos
    ws['!cols'] = Array(168).fill({ wch: 8 });

    return ws;
  }

  /**
   * Hoja 6: Registros con Error
   */
  private createInvalidRecordsSheet(registros: any[], errores: any[]): any {
    const XLSX = require('xlsx');

    const errorRegistroIds = new Set(
      errores.map((e) => e.registro_id)
    );
    const invalidRegistros = registros.filter((r) =>
      errorRegistroIds.has(r.id)
    );

    if (invalidRegistros.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([
        ['No hay registros con error'],
      ]);
      return ws;
    }

    // Obtener primeros 168 campos
    const headers = Array.from({ length: 168 }, (_, i) =>
      `v${String(i + 1).padStart(2, '0')}`
    );

    const data = [
      headers,
      ...invalidRegistros.map((r) =>
        headers.map((h) => r[h] || '')
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos mínimos
    ws['!cols'] = Array(168).fill({ wch: 8 });

    return ws;
  }

  /**
   * Generar nombre de archivo
   */
  private generateFileName(eapbCode: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `REPORTE_${eapbCode}_${year}${month}${day}.xlsx`;
  }

  /**
   * Formatear fecha
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO');
  }
}

export const excelExporter = new ExcelExporter();
