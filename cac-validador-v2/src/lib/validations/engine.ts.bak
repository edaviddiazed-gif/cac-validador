/**
 * Motor de validación — Orquestador principal.
 * Ejecuta todas las reglas sobre un conjunto de registros CACRecord.
 * @module lib/validations/engine
 */

import type { CACRecord } from "@/types/cac";
import { VARIABLE_NAMES, COMODINES_FECHA } from "@/types/cac";
import type {
  ValidationRule,
  ValidationContext,
  ValidationError,
  FileValidationResult,
  ValidationCatalogs,
} from "./types";

// Importar todos los grupos de reglas
import { rulesV01V16 } from "./rules/v01-v16";
import { rulesV17V44 } from "./rules/v17-v44";
import { rulesV45V73 } from "./rules/v45-v73";
import { rulesV74V85 } from "./rules/v74-v85";
import { rulesV86V105 } from "./rules/v86-v105";
import { rulesV106V110 } from "./rules/v106-v110";
import { rulesV111V134 } from "./rules/v111-v134";
import { crossValidationRules } from "./rules/cross-validations";

/** Todas las reglas de validación registradas */
const ALL_RULES: ValidationRule[] = [
  ...rulesV01V16,
  ...rulesV17V44,
  ...rulesV45V73,
  ...rulesV74V85,
  ...rulesV86V105,
  ...rulesV106V110,
  ...rulesV111V134,
  ...crossValidationRules,
];

/** Crea catálogos vacíos (para cuando no se cargan desde BD) */
export function createEmptyCatalogs(): ValidationCatalogs {
  return {
    cie10: new Set(),
    atc: new Set(),
    cups: new Set(),
    divipola: new Set(),
    ips: new Set(),
  };
}

/**
 * Detecta si un valor es un comodín de fecha CAC
 * Retorna el tipo de comodín o null
 */
export function detectComodin(value: string): string | null {
  if (value === COMODINES_FECHA.DESCONOCIDO) return "DESCONOCIDO";
  if (value === COMODINES_FECHA.NO_APLICA) return "NO_APLICA";
  if (value === COMODINES_FECHA.ENTE_TERRITORIAL) return "ENTE_TERRITORIAL";
  return null;
}

/**
 * Obtiene el valor string de un campo del registro dado el número de variable.
 * Busca la propiedad correspondiente en CACRecord.
 */
function getFieldValue(record: CACRecord, variable: number): string {
  const keyPrefix = `v${String(variable).padStart(2, "0")}`;
  const keys = Object.keys(record) as (keyof CACRecord)[];
  const matchingKey = keys.find((k) => k.startsWith(keyPrefix));
  if (!matchingKey) return "";
  const val = record[matchingKey];
  return val === null || val === undefined ? "" : String(val);
}

/**
 * Valida un solo registro contra todas las reglas.
 * @param record - Registro CACRecord a validar
 * @param lineNumber - Número de línea en el archivo
 * @param context - Contexto con catálogos
 * @returns Array de errores encontrados
 */
export function validateRecord(
  record: CACRecord,
  lineNumber: number,
  context: ValidationContext,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of ALL_RULES) {
    const value = getFieldValue(record, rule.variable);
    
    // Detección de comodín (fecha especial CAC)
    const comodin = detectComodin(value);
    if (comodin) {
      // NOTA: Los comodines se registran como warnings, no errores
      // El validador debe conocer que este campo contiene un comodín
      errors.push({
        lineNumber,
        variable: rule.variable,
        variableName:
          VARIABLE_NAMES[`v${String(rule.variable).padStart(2, "0")}`] ??
          `Variable ${rule.variable}`,
        ruleName: `comodin_${comodin.toLowerCase()}`,
        type: "comodin",
        severity: "info", // Comodines son informativos
        reportedValue: value,
        message: `Comodín [${comodin}] en V${rule.variable}: ${getComodinDescription(comodin)}`,
        suggestion: undefined,
      });
      continue; // No aplicar reglas adicionales si es comodín
    }

    const result = rule.validate(value, record, context);

    if (!result.valid && result.error) {
      const variableKey = `v${String(rule.variable).padStart(2, "0")}`;
      errors.push({
        lineNumber,
        variable: rule.variable,
        variableName:
          VARIABLE_NAMES[variableKey] ??
          `Variable ${rule.variable}`,
        ruleName: rule.name,
        type: rule.type,
        severity: rule.severity ?? "error",
        reportedValue: value,
        message: result.error,
        suggestion: result.suggestion,
      });
    }
  }

  return errors;
}

/**
 * Retorna descripción en español del comodín
 */
function getComodinDescription(comodin: string): string {
  switch (comodin) {
    case "DESCONOCIDO":
      return "Dato desconocido - debería investigarse";
    case "NO_APLICA":
      return "Variable no aplica al caso clínico";
    case "ENTE_TERRITORIAL":
      return "Reportado por ente territorial";
    default:
      return "Comodín especial";
  }
}

/**
 * Valida un archivo completo de registros CAC.
 * @param records - Array de registros parseados
 * @param catalogs - Catálogos de referencia (opcional)
 * @returns Resultado con estadísticas y errores
 */
export function validateFile(
  records: { lineNumber: number; record: CACRecord }[],
  catalogs?: ValidationCatalogs,
): FileValidationResult {
  const context: ValidationContext = {
    catalogos: catalogs ?? createEmptyCatalogs(),
    allRows: records.map((r) => r.record),
  };

  const allErrors: ValidationError[] = [];
  let invalidCount = 0;

  for (const { lineNumber, record } of records) {
    const recordErrors = validateRecord(record, lineNumber, context);
    if (recordErrors.length > 0) {
      invalidCount++;
      allErrors.push(...recordErrors);
    }
  }

  const total = records.length;
  const validCount = total - invalidCount;

  return {
    totalRecords: total,
    validRecords: validCount,
    invalidRecords: invalidCount,
    errors: allErrors,
    qualityPercentage:
      total > 0 ? Math.round((validCount / total) * 10000) / 100 : 0,
  };
}

/** Exportar reglas para testing */
export { ALL_RULES };
