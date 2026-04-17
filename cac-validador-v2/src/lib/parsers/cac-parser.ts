/**
 * Parser principal de archivos TXT ANSI de la CAC.
 * Parsea línea por línea, mapea 168 campos a 134 variables.
 * @module lib/parsers/cac-parser
 */

import type { CACRecord } from "@/types/cac";
import {
  EXPECTED_FIELD_COUNT,
  mapFieldsToRecord,
} from "./field-mapping";
import { detectForbiddenChars, type CharacterError } from "./character-validator";
import { validateFilename, type FilenameValidationResult } from "./filename-validator";

/** Error de parseo de una línea */
export interface ParseError {
  line: number;
  type: "field_count" | "encoding" | "character" | "parse";
  message: string;
  details?: CharacterError[];
}

/** Resultado de parsear un registro */
export interface ParsedRecord {
  lineNumber: number;
  record: CACRecord;
  rawFields: string[];
  characterErrors: CharacterError[];
}

/** Resultado completo del parseo del archivo */
export interface ParseResult {
  filename: FilenameValidationResult;
  records: ParsedRecord[];
  errors: ParseError[];
  totalLines: number;
}

/**
 * Parsea el contenido completo de un archivo TXT CAC.
 * @param content - Contenido del archivo como string (ya decodificado)
 * @param filename - Nombre del archivo para validación
 * @returns Resultado del parseo con registros y errores
 */
export function parseCAC(
  content: string,
  filename: string,
): ParseResult {
  const filenameResult = validateFilename(filename);
  const records: ParsedRecord[] = [];
  const errors: ParseError[] = [];

  // Normalizar saltos de línea
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const fields = line.split("\t");

    // Validar cantidad de campos
    if (fields.length < EXPECTED_FIELD_COUNT) {
      errors.push({
        line: lineNumber,
        type: "field_count",
        message:
          `Línea ${lineNumber}: se esperaban ${EXPECTED_FIELD_COUNT} campos, ` +
          `se encontraron ${fields.length}`,
      });
    }

    // Detectar caracteres prohibidos
    const charErrors = detectForbiddenChars(line, lineNumber);
    if (charErrors.length > 0) {
      errors.push({
        line: lineNumber,
        type: "character",
        message:
          `Línea ${lineNumber}: ${charErrors.length} carácter(es) prohibido(s) encontrado(s)`,
        details: charErrors,
      });
    }

    // Mapear campos a CACRecord
    try {
      const partial = mapFieldsToRecord(fields);
      records.push({
        lineNumber,
        record: partial as CACRecord,
        rawFields: fields,
        characterErrors: charErrors,
      });
    } catch (err) {
      errors.push({
        line: lineNumber,
        type: "parse",
        message: `Línea ${lineNumber}: error al parsear — ${String(err)}`,
      });
    }
  }

  return {
    filename: filenameResult,
    records,
    errors,
    totalLines: lines.length,
  };
}

/**
 * Parsea solo las primeras N líneas para preview rápido.
 * @param content - Contenido del archivo
 * @param filename - Nombre del archivo
 * @param maxLines - Número máximo de líneas a parsear
 */
export function parsePreview(
  content: string,
  filename: string,
  maxLines: number = 5,
): ParseResult {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, maxLines);

  return parseCAC(lines.join("\n"), filename);
}
