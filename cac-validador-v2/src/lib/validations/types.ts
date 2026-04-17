/**
 * Tipos e interfaces para el motor de validación CAC.
 * @module lib/validations/types
 */

import type { CACRecord } from "@/types/cac";

/** Resultado de una validación individual */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/** Tipo de error de validación */
export type ValidationRuleType =
  | "formato"
  | "rango"
  | "requerido"
  | "cruce"
  | "comodin"
  | "novedad"
  | "negocio"
  | "codificacion";

/** Severidad del error */
export type Severity = "error" | "warning" | "info";

/** Regla de validación individual */
export interface ValidationRule {
  /** Número de variable principal (1-134) */
  variable: number;
  /** Nombre descriptivo de la regla */
  name: string;
  /** Tipo de validación */
  type: ValidationRuleType;
  /** Severidad del error */
  severity?: Severity;
  /** Función de validación */
  validate: (
    value: string,
    row: CACRecord,
    context: ValidationContext,
  ) => ValidationResult;
  /** Generador de sugerencia de corrección */
  suggestion?: (value: string, row: CACRecord) => string;
}

/** Error de validación con contexto completo */
export interface ValidationError {
  lineNumber: number;
  variable: number;
  variableName: string;
  ruleName: string;
  type: ValidationRuleType;
  severity: Severity;
  reportedValue: string;
  message: string;
  suggestion?: string;
}

/** Catálogos de referencia para validaciones de rango */
export interface ValidationCatalogs {
  cie10: Set<string>;
  atc: Set<string>;
  cups: Set<string>;
  divipola: Set<string>;
  ips: Set<string>;
}

/** Contexto compartido para las validaciones */
export interface ValidationContext {
  catalogos: ValidationCatalogs;
  /** Todos los registros del archivo (para duplicados) */
  allRows?: CACRecord[];
}

/** Resultado agregado de validar un archivo completo */
export interface FileValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ValidationError[];
  qualityPercentage: number;
}
