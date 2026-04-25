/**
 * Punto de entrada del motor de validación v2.
 * Registra todas las reglas, incluyendo las portadas de v1
 * (clinical-validations + expansion-engine).
 *
 * @module lib/validations/index
 */

export { expandActiveFields, isFieldActive } from "./expansion-engine";
export type { ExpansionResult, GroupSummary } from "./expansion-engine";

export { clinicalValidationRules } from "./rules/clinical-validations";

// Re-exporta el runner principal y utilidades del engine
export {
  validateRecord,
  validateFile,
  createEmptyCatalogs,
  detectComodin,
  ALL_RULES,
} from "./engine";

// Re-exporta tipos para consumidores externos
export type {
  ValidationRule,
  ValidationError,
  ValidationContext,
  FileValidationResult,
  ValidationCatalogs,
  Severity,
  ValidationRuleType,
} from "./types";

// Fechas dinámicas por cohorte (portado de v1/motor_reglas.py)
export {
  buildCohortDateMap,
  translateCohortDate,
  isFixedDate,
  extractCutoffDate,
} from "./cohort-dates";

