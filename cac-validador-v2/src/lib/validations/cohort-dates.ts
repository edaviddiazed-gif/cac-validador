/**
 * Motor de fechas dinámicas por cohorte — portado de v1 (motor_reglas.py).
 *
 * El Excel de reglas CAC fue generado con cohorte base 2023 (corte 2024-01-01).
 * Este módulo traduce las fechas del Excel a la cohorte real del reporte,
 * usando V134 (fecha_corte) como referencia.
 *
 * Fechas FIJAS (nunca se traducen):
 *   1800-01-01 → Comodín: Desconocido
 *   1840-01-01 → Comodín: No aplica (mama in situ)
 *   1845-01-01 → Comodín: No aplica
 *   1846-01-01 → Comodín: PPNA / ente territorial
 *   1900-01-01 → Límite inferior fecha nacimiento
 *   1993-01-01 → Creación del SGSSS Colombia
 *
 * @module lib/validations/cohort-dates
 */

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Cohorte base del Excel (2023 → corte 2024-01-01) */
const COHORTE_BASE = new Date(2024, 0, 1); // 2024-01-01

/** Fechas que NUNCA se traducen — comodines semánticos y límites del SGSSS */
const FECHAS_FIJAS = new Set([
  "1800-01-01",
  "1840-01-01",
  "1845-01-01",
  "1846-01-01",
  "1900-01-01",
  "1993-01-01",
]);

// ─── Utilidades de fecha ─────────────────────────────────────────────────────

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addYears(d: Date, years: number): Date {
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function parseDate(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

// ─── Mapa de fechas por cohorte ──────────────────────────────────────────────

/**
 * Construye el mapa {fecha_excel_base → fecha_real} para la cohorte activa.
 *
 * Tabla de traducción (ejemplo para cohorte 2026→2027, corte=2027-01-01):
 *
 *   Excel base   │ Fórmula              │ Resultado
 *   ─────────────┼──────────────────────┼──────────────
 *   2024-01-01   │ fecha_corte          │ 2027-01-01
 *   2023-01-01   │ fecha_corte − 1a     │ 2026-01-01
 *   2023-01-02   │ fecha_corte −1a +1d  │ 2026-01-02 (inicio)
 *   2023-11-01   │ fecha_corte − 2m     │ 2026-11-01
 *   2021-01-01   │ fecha_corte − 3a     │ 2024-01-01
 *   2021-01-02   │ fecha_corte −3a +1d  │ 2024-01-02
 *   2017-01-01   │ fecha_corte − 7a     │ 2020-01-01
 *   2005-01-01   │ fecha_corte − 19a    │ 2008-01-01
 *   2004-01-01   │ fecha_corte − 20a    │ 2007-01-01
 */
export function buildCohortDateMap(
  fechaCorte: Date,
  fechaInicio?: Date,
): Map<string, string> {
  const fc = fechaCorte;
  const base = COHORTE_BASE;

  const fi =
    fechaInicio ?? addDays(addYears(fc, -1), 1); // corte - 1 año + 1 día

  const map = new Map<string, string>();

  // Corte
  map.set(fmt(base), fmt(fc));
  // -1 año
  map.set(fmt(addYears(base, -1)), fmt(addYears(fc, -1)));
  // -1 año + 1 día (inicio)
  map.set(
    fmt(addDays(addYears(base, -1), 1)),
    fmt(fi),
  );
  // -2 meses
  map.set(fmt(addMonths(base, -2)), fmt(addMonths(fc, -2)));
  // -3 años
  map.set(fmt(addYears(base, -3)), fmt(addYears(fc, -3)));
  // -3 años + 1 día
  map.set(
    fmt(addDays(addYears(base, -3), 1)),
    fmt(addDays(addYears(fc, -3), 1)),
  );
  // -7 años
  map.set(fmt(addYears(base, -7)), fmt(addYears(fc, -7)));
  // -19 años
  map.set(fmt(addYears(base, -19)), fmt(addYears(fc, -19)));
  // -20 años
  map.set(fmt(addYears(base, -20)), fmt(addYears(fc, -20)));

  return map;
}

/**
 * Traduce una fecha del Excel base a la cohorte real.
 * Si es una fecha fija (comodín) o no está en el mapa, la retorna sin cambios.
 */
export function translateCohortDate(
  valor: string,
  map: Map<string, string>,
): string {
  if (!valor || FECHAS_FIJAS.has(valor)) return valor;
  return map.get(valor) ?? valor;
}

/**
 * Verifica si un valor es una fecha comodín fija (nunca se traduce).
 */
export function isFixedDate(valor: string): boolean {
  return FECHAS_FIJAS.has(valor);
}

/**
 * Extrae la fecha de corte (V134) de un registro CACRecord.
 * Retorna null si no se puede parsear.
 */
export function extractCutoffDate(record: Record<string, any>): Date | null {
  const v134 =
    record.v134_fecha_corte ??
    record.resultado?.fecha_bdua ??
    record.cabecera?.fecha_corte ??
    null;

  if (!v134) return null;
  return parseDate(String(v134));
}

// ─── Constantes exportadas ──────────────────────────────────────────────────

export { FECHAS_FIJAS, COHORTE_BASE };
