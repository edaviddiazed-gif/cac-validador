/**
 * Utilidades comunes para reglas de validación.
 * @module lib/validations/helpers
 */

import { COMODINES_FECHA } from "@/types/cac";
import type { ValidationResult } from "./types";

/** Verifica si un valor es un comodín de fecha */
export function isComodin(value: string): boolean {
  return (
    value === COMODINES_FECHA.DESCONOCIDO ||
    value === COMODINES_FECHA.NO_APLICA ||
    value === COMODINES_FECHA.ENTE_TERRITORIAL
  );
}

/** Verifica si un valor está vacío o es whitespace */
export function isEmpty(value: string | number): boolean {
  if (typeof value === "number") return false;
  return value.trim() === "";
}

/** Valida formato de fecha AAAA-MM-DD */
export function isValidDate(value: string): boolean {
  if (isComodin(value)) return true;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/** Valida que un valor esté en un rango numérico */
export function inRange(
  value: number,
  min: number,
  max: number,
): boolean {
  return value >= min && value <= max;
}

/** Crea un resultado válido */
export function valid(): ValidationResult {
  return { valid: true };
}

/** Crea un resultado inválido con mensaje */
export function invalid(
  error: string,
  suggestion?: string,
): ValidationResult {
  return { valid: false, error, suggestion };
}

/** Helper para validar campo requerido (no vacío) */
export function requiredField(
  value: string | number,
  variableName: string,
): ValidationResult {
  if (isEmpty(value)) {
    return invalid(`${variableName} es obligatorio y no puede estar vacío`);
  }
  return valid();
}

/** Helper para valor numérico en rango con NA (98) */
export function numericInRangeOrNA(
  value: number,
  min: number,
  max: number,
  variableName: string,
  naValues: number[] = [98, 97],
): ValidationResult {
  if (naValues.includes(value)) return valid();
  if (!inRange(value, min, max)) {
    return invalid(
      `${variableName}: valor ${value} fuera de rango [${min}-${max}]`,
      `Use un valor entre ${min} y ${max}, o ${naValues.join("/")} para No Aplica`,
    );
  }
  return valid();
}
