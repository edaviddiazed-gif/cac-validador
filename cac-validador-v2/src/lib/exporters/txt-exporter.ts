/**
 * TxtExporter
 * FASE 4A: Exporta registros a formato TXT ANSI correcto para SISCAC
 * 
 * Especificación Resolución 0247/2014:
 * - Encoding: Windows-1252 (ANSI), NO UTF-8
 * - Separador: tabulación (\t)
 * - Sin headers
 * - Sin caracteres especiales
 * - Nombre: {YYYYMMDD}_{CODEAPB}_CANCER.txt
 * - Validación: re-parsearlo y verificar 0 errores
 */

interface ExportOptions {
  onlyValid?: boolean;
  removeSpecialChars?: boolean;
}

export interface TxtExportResult {
  success: boolean;
  fileContent: string;
  fileName: string;
  fileSize: number;
  lineCount: number;
  validationErrors?: string[];
}

const SPECIAL_CHARS_MAP: Record<string, string> = {
  'ñ': 'n',
  'á': 'a',
  'é': 'e',
  'í': 'i',
  'ó': 'o',
  'ú': 'u',
  'ü': 'u',
  'Ñ': 'N',
  'Á': 'A',
  'É': 'E',
  'Í': 'I',
  'Ó': 'O',
  'Ú': 'U',
  'Ü': 'U',
  '&': 'y',
  '#': '',
  '°': 'o',
  '´': "'",
};

export class TxtExporter {
  /**
   * Exportar registros a TXT ANSI
   */
  async export(
    registros: any[],
    eapbCode: string,
    options: ExportOptions = {}
  ): Promise<TxtExportResult> {
    try {
      const { onlyValid = false, removeSpecialChars = true } = options;

      // 1. Filtrar registros si onlyValid
      let registrosExportar = registros;
      if (onlyValid) {
        registrosExportar = registros.filter(
          (r) => !r.tiene_error || r.errores?.length === 0
        );
      }

      // 2. Convertir registros a líneas TSV
      const lines = registrosExportar.map((registro) =>
        this.registroToLine(registro, removeSpecialChars)
      );

      // 3. Unir en string (sin headers)
      const fileContent = lines.join('\n');

      // 4. Generar nombre de archivo
      const fileName = this.generateFileName(eapbCode);

      // 5. Validar archivo generado
      const validationErrors = this.validateExport(fileContent);

      if (validationErrors.length > 0) {
        return {
          success: false,
          fileContent: '',
          fileName: '',
          fileSize: 0,
          lineCount: 0,
          validationErrors,
        };
      }

      // 6. Retornar resultado
      return {
        success: true,
        fileContent,
        fileName,
        fileSize: Buffer.byteLength(fileContent, 'utf-8'),
        lineCount: lines.length,
      };
    } catch (error) {
      return {
        success: false,
        fileContent: '',
        fileName: '',
        fileSize: 0,
        lineCount: 0,
        validationErrors: [
          error instanceof Error ? error.message : 'Unknown error',
        ],
      };
    }
  }

  /**
   * Convertir un registro individual a línea TSV
   */
  private registroToLine(registro: any, sanitize: boolean): string {
    // Obtener todos los campos del registro (en orden v01 a v168)
    const campos: string[] = [];

    for (let i = 1; i <= 168; i++) {
      const fieldName = `v${String(i).padStart(2, '0')}`;
      let value = registro[fieldName] || '';

      // Convertir a string
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value !== 'string') {
        value = String(value).trim();
      } else {
        value = value.trim();
      }

      // Sanitizar caracteres especiales si está habilitado
      if (sanitize) {
        value = this.sanitizeValue(value);
      }

      campos.push(value);
    }

    // Unir con tabulación
    return campos.join('\t');
  }

  /**
   * Remover caracteres especiales
   */
  private sanitizeValue(value: string): string {
    if (!value) return value;

    let sanitized = value;

    // Reemplazar caracteres especiales
    for (const [special, replacement] of Object.entries(SPECIAL_CHARS_MAP)) {
      sanitized = sanitized.split(special).join(replacement);
    }

    // Remover caracteres no ASCII (excepto tabulación y salto línea)
    sanitized = sanitized
      .split('')
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code < 128 || code === 9 || code === 10;
      })
      .join('');

    return sanitized;
  }

  /**
   * Generar nombre de archivo según formato CAC
   * Formato: YYYYMMDD_CODEAPB_CANCER.txt
   */
  private generateFileName(eapbCode: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const code = String(eapbCode).padStart(4, '0');

    return `${year}${month}${day}_${code}_CANCER.txt`;
  }

  /**
   * Validar archivo generado
   * - Verificar que tenga líneas
   * - Verificar que cada línea tenga 168 campos
   * - Verificar que no tenga caracteres inválidos
   */
  private validateExport(fileContent: string): string[] {
    const errors: string[] = [];

    if (!fileContent || fileContent.trim().length === 0) {
      errors.push('Archivo vacío');
      return errors;
    }

    const lines = fileContent.split('\n').filter((l) => l.trim());

    if (lines.length === 0) {
      errors.push('No hay líneas en el archivo');
      return errors;
    }

    // Validar cada línea
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      const line = lines[i];
      const fields = line.split('\t');

      if (fields.length !== 168) {
        errors.push(
          `Línea ${i + 1}: esperada 168 campos, encontrados ${fields.length}`
        );
        break;
      }

      // Validar que no haya caracteres especiales
      if (/[ñáéíóúüñ&#°´]/.test(line)) {
        errors.push(`Línea ${i + 1}: contiene caracteres especiales`);
        break;
      }
    }

    return errors;
  }

  /**
   * Generar preview de primeras 5 líneas
   */
  getPreview(fileContent: string, maxLines: number = 5): string {
    const lines = fileContent.split('\n').slice(0, maxLines);
    return lines.map((line) => {
      // Mostrar solo primeros 100 caracteres por línea
      const preview = line.substring(0, 100);
      return preview + (line.length > 100 ? '...' : '');
    }).join('\n');
  }
}

// Exportar singleton
export const txtExporter = new TxtExporter();
