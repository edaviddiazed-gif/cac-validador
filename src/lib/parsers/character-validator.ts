/**
 * Detección de caracteres prohibidos en los datos CAC.
 * Solo se permite ASCII básico (sin ñ, tildes, &, #, °, ´).
 * @module lib/parsers/character-validator
 */

/** Mapa de caracteres prohibidos → reemplazo sugerido */
const CHAR_REPLACEMENTS: Record<string, string> = {
  "ñ": "n",
  "Ñ": "N",
  "á": "a",
  "é": "e",
  "í": "i",
  "ó": "o",
  "ú": "u",
  "Á": "A",
  "É": "E",
  "Í": "I",
  "Ó": "O",
  "Ú": "U",
  "ü": "u",
  "Ü": "U",
  "&": "Y",
  "#": "",
  "°": "",
  "´": "",
};

/** Regex que detecta cualquier carácter prohibido */
const FORBIDDEN_CHARS_REGEX = /[ñÑáéíóúÁÉÍÓÚüÜ&#°´]/g;

/** Error de carácter prohibido con posición exacta */
export interface CharacterError {
  char: string;
  position: number;
  line: number;
  column: number;
  replacement: string;
}

/**
 * Detecta caracteres prohibidos en una línea de texto.
 * @param text - Texto a verificar
 * @param lineNumber - Número de línea (1-based)
 * @returns Array de errores con posición y reemplazo sugerido
 */
export function detectForbiddenChars(
  text: string,
  lineNumber: number,
): CharacterError[] {
  const errors: CharacterError[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  FORBIDDEN_CHARS_REGEX.lastIndex = 0;

  while ((match = FORBIDDEN_CHARS_REGEX.exec(text)) !== null) {
    errors.push({
      char: match[0],
      position: match.index,
      line: lineNumber,
      column: match.index + 1,
      replacement: CHAR_REPLACEMENTS[match[0]] ?? "",
    });
  }

  return errors;
}

/**
 * Limpia una línea reemplazando caracteres prohibidos.
 * @param text - Texto a limpiar
 * @returns Texto con caracteres reemplazados
 */
export function sanitizeText(text: string): string {
  return text.replace(FORBIDDEN_CHARS_REGEX, (char) => {
    return CHAR_REPLACEMENTS[char] ?? "";
  });
}
