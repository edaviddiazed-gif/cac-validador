/**
 * PdfReporter
 * FASE 4B: Generar reporte PDF ejecutivo con jsPDF
 * 
 * Estructura:
 * - Portada: Logo CAC, EAPB, período
 * - Resumen ejecutivo: KPIs
 * - Análisis de errores: gráficos y tablas
 * - Top 10 errores
 * - Recomendaciones
 * - Pie de página: Resolución 0247/2014
 */

interface ReporteData {
  eapbNombre: string;
  eapbCodigo: string;
  periodCorte: Date;
  totalRegistros: number;
  registrosValidos: number;
  registrosConError: number;
  errores: any[];
  fechaGeneracion?: Date;
}

export interface PdfExportResult {
  success: boolean;
  pdfBytes?: Uint8Array;
  fileName: string;
  fileSize: number;
  error?: string;
}

export class PdfReporter {
  /**
   * Generar reporte PDF
   */
  async generate(reporteData: ReporteData): Promise<PdfExportResult> {
    try {
      // Importar jsPDF dinámicamente para evitar SSR issues
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 10;

      // 1. Portada
      this.addCoverPage(doc, reporteData);
      doc.addPage();
      currentY = 10;

      // 2. Resumen Ejecutivo
      this.addSummary(doc, reporteData, currentY);
      doc.addPage();
      currentY = 10;

      // 3. Análisis de Errores
      this.addErrorAnalysis(doc, reporteData, currentY);

      // 4. Pie de página en todas las páginas
      this.addFooters(doc, reporteData);

      // 5. Obtener bytes del PDF
      const pdfBytes = doc.output('arraybuffer') as unknown as Uint8Array;

      const fileName = this.generateFileName(reporteData.eapbCodigo);

      return {
        success: true,
        pdfBytes,
        fileName,
        fileSize: pdfBytes.byteLength,
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
   * Agregar portada
   */
  private addCoverPage(doc: any, data: ReporteData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Fondo gradiente simulado (rectángulo azul)
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, pageWidth, 80, 'F');

    // Título "REPORTE DE VALIDACIÓN"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(255, 255, 255);
    doc.text('REPORTE DE VALIDACIÓN', pageWidth / 2, 40, {
      align: 'center',
    });

    // Subtítulo "CUENTA DE ALTO COSTO"
    doc.setFontSize(14);
    doc.text('Resolución 0247/2014', pageWidth / 2, 55, {
      align: 'center',
    });

    // Información del reporte
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    doc.text(`EAPB: ${data.eapbNombre}`, pageWidth / 2, 120, {
      align: 'center',
    });
    doc.text(
      `Período: ${this.formatDate(data.periodCorte)}`,
      pageWidth / 2,
      135,
      { align: 'center' }
    );
    doc.text(
      `Generado: ${this.formatDate(data.fechaGeneracion || new Date())}`,
      pageWidth / 2,
      150,
      { align: 'center' }
    );

    // KPIs principales
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');

    const kpis = [
      { label: 'Registros', value: data.totalRegistros.toLocaleString() },
      {
        label: 'Válidos',
        value: `${data.registrosValidos} (${Math.round((data.registrosValidos / data.totalRegistros) * 100)}%)`,
      },
      { label: 'Con Error', value: data.registrosConError },
    ];

    let yPos = 180;
    for (const kpi of kpis) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${kpi.label}:`, 30, yPos);

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(String(kpi.value), 80, yPos);

      yPos += 20;
    }
  }

  /**
   * Agregar resumen ejecutivo
   */
  private addSummary(doc: any, data: ReporteData, startY: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = startY;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RESUMEN EJECUTIVO', 20, y);
    y += 15;

    // Línea separadora
    doc.setDrawColor(33, 150, 243);
    doc.line(20, y - 2, pageWidth - 20, y - 2);
    y += 10;

    // Tabla de métricas
    const metrics = [
      ['Métrica', 'Valor', '%'],
      [
        'Total Registros',
        data.totalRegistros.toLocaleString(),
        '100%',
      ],
      [
        'Registros Válidos',
        data.registrosValidos.toLocaleString(),
        `${Math.round((data.registrosValidos / data.totalRegistros) * 100)}%`,
      ],
      [
        'Registros con Error',
        data.registrosConError.toLocaleString(),
        `${Math.round((data.registrosConError / data.totalRegistros) * 100)}%`,
      ],
      [
        'Tasa de Calidad',
        `${Math.round((data.registrosValidos / data.totalRegistros) * 100)}%`,
        '',
      ],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    for (let i = 0; i < metrics.length; i++) {
      const [label, value, percent] = metrics[i];

      if (i === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(33, 150, 243);
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFillColor(i % 2 === 0 ? 240, 240, 240 : 255, 255, 255);
        doc.setTextColor(0, 0, 0);
      }

      doc.rect(20, y, pageWidth - 40, 8, 'F');
      doc.text(label, 25, y + 5);
      doc.text(value, pageWidth / 2, y + 5);
      if (percent) doc.text(percent, pageWidth - 30, y + 5);

      y += 8;
    }

    y += 10;

    // Recomendaciones principales
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Recomendaciones Principales:', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const recommendations = this.generateRecommendations(data);
    for (const rec of recommendations.slice(0, 5)) {
      doc.text(`• ${rec}`, 25, y, { maxWidth: pageWidth - 50 });
      y += 8;
    }
  }

  /**
   * Agregar análisis de errores
   */
  private addErrorAnalysis(doc: any, data: ReporteData, startY: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = startY;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ANÁLISIS DE ERRORES', 20, y);
    y += 10;

    // Top 10 errores
    const topErrors = this.getTopErrors(data.errores, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (let i = 0; i < topErrors.length; i++) {
      const error = topErrors[i];

      // Check si necesitamos nueva página
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Línea del error
      const percentage = (
        (error.count / data.registrosConError) *
        100
      ).toFixed(1);

      doc.setFillColor(
        255 - i * 10,
        200 - i * 5,
        200 - i * 5
      );
      doc.rect(20, y, pageWidth - 40, 6, 'F');

      doc.setTextColor(0, 0, 0);
      doc.text(
        `${i + 1}. Variable ${error.variable}: ${error.count} errores (${percentage}%)`,
        25,
        y + 4
      );

      y += 8;
    }
  }

  /**
   * Agregar pie de página
   */
  private addFooters(doc: any, data: ReporteData): void {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Resolución 0247/2014 • Página ${i} de ${pageCount} • Generado: ${this.formatDate(
          new Date()
        )}`,
        doc.internal.pageSize.getWidth() / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  /**
   * Obtener top N errores
   */
  private getTopErrors(
    errores: any[],
    limit: number = 10
  ): Array<{ variable: number; count: number }> {
    const grouped: Record<number, number> = {};

    for (const error of errores) {
      const varNum = error.variable_numero || error.variable;
      grouped[varNum] = (grouped[varNum] || 0) + 1;
    }

    return Object.entries(grouped)
      .map(([variable, count]) => ({
        variable: parseInt(variable),
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Generar recomendaciones basadas en patrones
   */
  private generateRecommendations(data: ReporteData): string[] {
    const recs: string[] = [];
    const errorRate = (data.registrosConError / data.totalRegistros) * 100;

    if (errorRate > 30) {
      recs.push('Alto porcentaje de errores (>30%). Revisar proceso de captura de datos.');
    }
    if (errorRate > 15 && errorRate <= 30) {
      recs.push('Porcentaje moderado de errores. Enfocarse en categorías con más fallos.');
    }
    if (errorRate <= 15) {
      recs.push('Tasa de calidad buena. Continuar con validaciones periódicas.');
    }

    recs.push('Validar que códigos CIE-10 sean correctos en diagnósticos.');
    recs.push('Revisar fechas de diagnóstico vs fechas de biopsia.');
    recs.push('Verificar campos requeridos estén completos.');

    return recs;
  }

  /**
   * Generar nombre de archivo
   */
  private generateFileName(eapbCode: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `REPORTE_${eapbCode}_${year}${month}${day}.pdf`;
  }

  /**
   * Formatear fecha
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export const pdfReporter = new PdfReporter();
