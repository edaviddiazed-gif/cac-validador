/**
 * Validación del nombre de archivo CAC.
 * Patrón: AAAAMMDD_CODEAPB_CANCER.txt
 * @module lib/parsers/filename-validator
 */

/** Regex para el nombre del archivo CAC */
const CAC_FILENAME_REGEX = /^\d{8}_[A-Z0-9]{5,10}_CANCER\.txt$/;

/** Resultado de validación del nombre de archivo */
export interface FilenameValidationResult {
  valid: boolean;
  error?: string;
  parsed?: {
    fecha: string;
    codigoEapb: string;
  };
}

/**
 * Valida que el nombre del archivo cumpla con el patrón CAC.
 * @param filename - Nombre del archivo (sin ruta)
 * @returns Resultado con datos parseados si es válido
 */
export function validateFilename(
  filename: string,
): FilenameValidationResult {
  if (!CAC_FILENAME_REGEX.test(filename)) {
    return {
      valid: false,
      error: `Nombre de archivo inválido: "${filename}". ` +
        `Patrón esperado: AAAAMMDD_CODEAPB_CANCER.txt ` +
        `(ej: 20230505_EPS001_CANCER.txt)`,
    };
  }

  const parts = filename.replace(".txt", "").split("_");
  const fechaStr = parts[0];

  // Validar que la fecha sea real
  const year = parseInt(fechaStr.substring(0, 4), 10);
  const month = parseInt(fechaStr.substring(4, 6), 10);
  const day = parseInt(fechaStr.substring(6, 8), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      valid: false,
      error: `Fecha inválida en nombre de archivo: ${fechaStr}`,
    };
  }

  return {
    valid: true,
    parsed: {
      fecha: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      codigoEapb: parts[1],
    },
  };
}
