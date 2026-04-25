/**
 * Motor de validacion -- Orquestador principal.
 * Ejecuta todas las reglas sobre un conjunto de registros CACRecord.
 * @module lib/validations/engine
 *
 * v2.1 (integracion v1):
 *   - clinicalValidationRules  portado de v1/clinicos.py
 *   - expandActiveFields       portado de v1/expansion.py
 *     omite sub-variables V46.x, V53.x, V66.x, V114.x inactivas
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

// Grupos de reglas existentes
import { rulesV01V16 }      from "./rules/v01-v16";
import { rulesV17V44 }      from "./rules/v17-v44";
import { rulesV45V73 }      from "./rules/v45-v73";
import { rulesV74V85 }      from "./rules/v74-v85";
import { rulesV86V105 }     from "./rules/v86-v105";
import { rulesV106V110 }    from "./rules/v106-v110";
import { rulesV111V134 }    from "./rules/v111-v134";
import { crossValidationRules } from "./rules/cross-validations";

// ── NUEVAS INTEGRACIONES v1 ────────────────────────────────────────────────
import { clinicalValidationRules }        from "./rules/clinical-validations";
import { expandActiveFields, isFieldActive } from "./expansion-engine";
// ──────────────────────────────────────────────────────────────────────────

/** Todas las reglas de validacion registradas */
const ALL_RULES: ValidationRule[] = [
  ...rulesV01V16,
  ...rulesV17V44,
  ...rulesV45V73,
  ...rulesV74V85,
  ...rulesV86V105,
  ...rulesV106V110,
  ...rulesV111V134,
  ...crossValidationRules,
  // Reglas clinicas portadas de v1 (coherencia tumoral, codificacion, novedades)
  ...clinicalValidationRules,
];

/** Crea catalogos vacios (para cuando no se cargan desde BD) */
export function createEmptyCatalogs(): ValidationCatalogs {
  return {
    cie10:    new Set(),
    atc:      new Set(),
    cups:     new Set(),
    divipola: new Set(),
    ips:      new Set(),
  };
}

/**
 * Detecta si un valor es un comodin de fecha CAC.
 * Retorna el tipo de comodin o null.
 */
export function detectComodin(value: string): string | null {
  if (value === COMODINES_FECHA.DESCONOCIDO)    return "DESCONOCIDO";
  if (value === COMODINES_FECHA.NO_APLICA)       return "NO_APLICA";
  if (value === COMODINES_FECHA.ENTE_TERRITORIAL) return "ENTE_TERRITORIAL";
  return null;
}

/**
 * Obtiene el valor string de un campo del registro dado el numero de variable.
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
 * Obtiene la clave real del campo para el numero de variable dado.
 * Necesario para verificar si el campo esta activo en el expansion-engine.
 */
function getFieldKey(
  record: CACRecord,
  variable: number,
): keyof CACRecord | null {
  const keyPrefix = `v${String(variable).padStart(2, "0")}`;
  const keys = Object.keys(record) as (keyof CACRecord)[];
  return keys.find((k) => k.startsWith(keyPrefix)) ?? null;
}

/**
 * Valida un solo registro contra todas las reglas.
 *
 * Integracion v1 -- expansion-engine:
 *   Antes de evaluar cada regla, verifica si el campo es un sub-campo
 *   dinamico (V46.x, V53.x, V66.x, V114.x). Si el expansion-engine
 *   indica que ese campo NO aplica para este registro, la regla se omite
 *   para evitar falsos positivos.
 *
 * @param record     - Registro CACRecord a validar
 * @param lineNumber - Numero de linea en el archivo
 * @param context    - Contexto con catalogos
 */
export function validateRecord(
  record: CACRecord,
  lineNumber: number,
  context: ValidationContext,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // ── Expansion de grupos dinamicos (portado de v1/expansion.py) ──────────
  const { activeFields } = expandActiveFields(record);
  // ────────────────────────────────────────────────────────────────────────

  for (const rule of ALL_RULES) {
    // ── Verificar si el campo es un grupo dinamico activo ──────────────────
    const fieldKey = getFieldKey(record, rule.variable);
    if (fieldKey && !isFieldActive(record, fieldKey, activeFields)) {
      // Campo no aplica para este registro segun expansion-engine -- omitir
      continue;
    }
    // ────────────────────────────────────────────────────────────────────────

    const value = getFieldValue(record, rule.variable);

    // Deteccion de comodin (fecha especial CAC)
    const comodin = detectComodin(value);
    if (comodin) {
      errors.push({
        lineNumber,
        variable: rule.variable,
        variableName:
          VARIABLE_NAMES[`v${String(rule.variable).padStart(2, "0")}`] ??
          `Variable ${rule.variable}`,
        ruleName: `comodin_${comodin.toLowerCase()}`,
        type: "comodin",
        severity: "info",
        reportedValue: value,
        message: `Comodin [${comodin}] en V${rule.variable}: ${getComodinDescription(comodin)}`,
        suggestion: undefined,
      });
      continue;
    }

    const result = rule.validate(value, record, context);

    if (!result.valid && result.error) {
      const variableKey = `v${String(rule.variable).padStart(2, "0")}`;
      errors.push({
        lineNumber,
        variable: rule.variable,
        variableName:
          VARIABLE_NAMES[variableKey] ?? `Variable ${rule.variable}`,
        ruleName:      rule.name,
        type:          rule.type,
        severity:      rule.severity ?? "error",
        reportedValue: value,
        message:       result.error,
        suggestion:    result.suggestion,
      });
    }
  }

  return errors;
}

/** Retorna descripcion en espanol del comodin */
function getComodinDescription(comodin: string): string {
  switch (comodin) {
    case "DESCONOCIDO":    return "Dato desconocido - deberia investigarse";
    case "NO_APLICA":      return "Variable no aplica al caso clinico";
    case "ENTE_TERRITORIAL": return "Reportado por ente territorial";
    default:               return "Comodin especial";
  }
}

/**
 * Valida un archivo completo de registros CAC.
 *
 * @param records  - Array de registros parseados
 * @param catalogs - Catalogos de referencia (opcional)
 */
export function validateFile(
  records: { lineNumber: number; record: CACRecord }[],
  catalogs?: ValidationCatalogs,
): FileValidationResult {
  const context: ValidationContext = {
    catalogos: catalogs ?? createEmptyCatalogs(),
    allRows:   records.map((r) => r.record),
  };

  const allErrors: ValidationError[] = [];
  let invalidCount = 0;

  for (const { lineNumber, record } of records) {
    const recordErrors = validateRecord(record, lineNumber, context);
    // Separar comodines (info) de errores reales para el conteo
    const realErrors = recordErrors.filter((e) => e.severity !== "info");
    if (realErrors.length > 0) invalidCount++;
    allErrors.push(...recordErrors);
  }

  const total      = records.length;
  const validCount = total - invalidCount;

  return {
    totalRecords:      total,
    validRecords:      validCount,
    invalidRecords:    invalidCount,
    errors:            allErrors,
    qualityPercentage:
      total > 0 ? Math.round((validCount / total) * 10000) / 100 : 0,
  };
}

/** Exportar reglas para testing */
export { ALL_RULES };
