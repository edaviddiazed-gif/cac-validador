/**
 * Motor de expansión de grupos dinámicos — portado de v1 (expansion.py).
 * Determina qué sub-variables V46.x, V53.x, V66.x, V114.x aplican
 * ANTES de ejecutar las reglas de validación, eliminando falsos positivos.
 *
 * @module lib/validations/expansion-engine
 */

import type { CACRecord } from "@/types/cac";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface DynamicGroup {
  description: string;
  /** Variables del grupo, ej: ["V53.1","V53.2",...] */
  variables: string[];
  /** Claves de CACRecord que corresponden a esas variables */
  fields: (keyof CACRecord)[];
}

export interface ExpansionResult {
  /** Set de claves CACRecord que están activas para este registro */
  activeFields: Set<keyof CACRecord>;
  /** Diagnóstico: estado de cada grupo */
  groupSummary: Record<string, GroupSummary>;
}

export interface GroupSummary {
  description: string;
  active: boolean;
  activeCount: number;
  totalCount: number;
  variables: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getField(record: CACRecord, key: keyof CACRecord): string {
  const val = record[key];
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function toNum(val: string): number {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

// ─── Lógica de expansión ───────────────────────────────────────────────────

/**
 * Calcula qué campos de CACRecord son validables para este registro.
 * Portado fielmente desde v1 expansion.py:
 *
 *   - V46.1–V46.8  : Fases QT  → activas si v45_recibio_qs=1
 *   - V53.1–V53.9  : Meds primer esquema → activas según v52_num_meds_primer
 *   - V54–V56      : Meds adicionales primer → activas si recibió QT
 *   - V66.1–V66.9  : Meds último esquema → activas según v65_num_meds_ultimo
 *   - V67–V69      : Meds adicionales último → activas si recibió QT
 *   - V114.1–V114.6: Cuidado paliativo → activas si v113_valorado_paliativos=1
 */
export function expandActiveFields(record: CACRecord): ExpansionResult {
  const activeFields = new Set<keyof CACRecord>();
  const groupSummary: Record<string, GroupSummary> = {};

  // ── Grupo 1: Fases de quimioterapia V46.1-V46.8 ──
  // Activo si recibió terapia sistémica (v45_recibio_qs == 1)
  const recibioQt = toNum(getField(record, "v45_recibio_qs" as keyof CACRecord));
  const fasesFields: (keyof CACRecord)[] = [
    "v46_1_fase_prefase", "v46_2_fase_induccion",
    "v46_3_fase_intensificacion", "v46_4_fase_consolidacion",
    "v46_5_fase_reinduccion", "v46_6_fase_mantenimiento",
    "v46_7_fase_mantenimiento_largo", "v46_8_fase_otra",
  ] as unknown as (keyof CACRecord)[];
  const fasesVars = ["V46.1","V46.2","V46.3","V46.4","V46.5","V46.6","V46.7","V46.8"];
  const fasesActive = recibioQt === 1;
  const fasesCount = fasesActive ? fasesFields.length : 0;
  if (fasesActive) fasesFields.forEach(f => activeFields.add(f));
  groupSummary["fases_qt"] = {
    description: "Fases de quimioterapia (V46.1-V46.8)",
    active: fasesActive,
    activeCount: fasesCount,
    totalCount: fasesFields.length,
    variables: fasesActive ? fasesVars : [],
  };

  // ── Grupo 2: Medicamentos primer esquema V53.1-V53.9 ──
  // Controlado por v52_num_meds_primer (cuántos medicamentos aplican)
  const numMedsPrimer = toNum(getField(record, "v52_num_meds_primer" as keyof CACRecord));
  const medsPrimerFields: (keyof CACRecord)[] = [
    "v53_1_med_atc_primer", "v53_2_med_atc_primer",
    "v53_3_med_atc_primer", "v53_4_med_atc_primer",
    "v53_5_med_atc_primer", "v53_6_med_atc_primer",
    "v53_7_med_atc_primer", "v53_8_med_atc_primer",
    "v53_9_med_atc_primer",
  ] as unknown as (keyof CACRecord)[];
  const medsPrimerVars = Array.from({length:9}, (_,i) => `V53.${i+1}`);
  const medsPrimerActive = recibioQt === 1;
  const nMedsPrimer = medsPrimerActive ? Math.min(Math.max(numMedsPrimer, 0), 9) : 0;
  if (medsPrimerActive) {
    medsPrimerFields.slice(0, nMedsPrimer).forEach(f => activeFields.add(f));
  }
  groupSummary["medicamentos_primer"] = {
    description: "Medicamentos primer esquema (V53.1-V53.9)",
    active: medsPrimerActive,
    activeCount: nMedsPrimer,
    totalCount: 9,
    variables: medsPrimerVars.slice(0, nMedsPrimer),
  };

  // ── Grupo 3: Medicamentos adicionales primer esquema V54-V56 ──
  const medsAdicPrimerFields: (keyof CACRecord)[] = [
    "v54_med_adicional_primer_1", "v55_med_adicional_primer_2", "v56_med_adicional_primer_3",
  ] as unknown as (keyof CACRecord)[];
  if (recibioQt === 1) medsAdicPrimerFields.forEach(f => activeFields.add(f));
  groupSummary["medicamentos_primer_adicionales"] = {
    description: "Medicamentos adicionales primer esquema (V54-V56)",
    active: recibioQt === 1,
    activeCount: recibioQt === 1 ? 3 : 0,
    totalCount: 3,
    variables: recibioQt === 1 ? ["V54","V55","V56"] : [],
  };

  // ── Grupo 4: Medicamentos último esquema V66.1-V66.9 ──
  const numMedsUltimo = toNum(getField(record, "v65_num_meds_ultimo" as keyof CACRecord));
  const medsUltimoFields: (keyof CACRecord)[] = [
    "v66_1_med_atc_ultimo", "v66_2_med_atc_ultimo",
    "v66_3_med_atc_ultimo", "v66_4_med_atc_ultimo",
    "v66_5_med_atc_ultimo", "v66_6_med_atc_ultimo",
    "v66_7_med_atc_ultimo", "v66_8_med_atc_ultimo",
    "v66_9_med_atc_ultimo",
  ] as unknown as (keyof CACRecord)[];
  const medsUltimoVars = Array.from({length:9}, (_,i) => `V66.${i+1}`);
  const medsUltimoActive = recibioQt === 1;
  const nMedsUltimo = medsUltimoActive ? Math.min(Math.max(numMedsUltimo, 0), 9) : 0;
  if (medsUltimoActive) {
    medsUltimoFields.slice(0, nMedsUltimo).forEach(f => activeFields.add(f));
  }
  groupSummary["medicamentos_ultimo"] = {
    description: "Medicamentos último esquema (V66.1-V66.9)",
    active: medsUltimoActive,
    activeCount: nMedsUltimo,
    totalCount: 9,
    variables: medsUltimoVars.slice(0, nMedsUltimo),
  };

  // ── Grupo 5: Medicamentos adicionales último esquema V67-V69 ──
  const medsAdicUltimoFields: (keyof CACRecord)[] = [
    "v67_med_adicional_ultimo_1", "v68_med_adicional_ultimo_2", "v69_med_adicional_ultimo_3",
  ] as unknown as (keyof CACRecord)[];
  if (recibioQt === 1) medsAdicUltimoFields.forEach(f => activeFields.add(f));
  groupSummary["medicamentos_ultimo_adicionales"] = {
    description: "Medicamentos adicionales último esquema (V67-V69)",
    active: recibioQt === 1,
    activeCount: recibioQt === 1 ? 3 : 0,
    totalCount: 3,
    variables: recibioQt === 1 ? ["V67","V68","V69"] : [],
  };

  // ── Grupo 6: Cuidados paliativos V114.1-V114.6 ──
  const valoradoPaliativos = toNum(getField(record, "v113_valorado_paliativos" as keyof CACRecord));
  const paliativosFields: (keyof CACRecord)[] = [
    "v114_1_med_especialista_paliativo", "v114_2_prof_especialista_paliativo",
    "v114_3_med_especialista_otra", "v114_4_med_general",
    "v114_5_trabajo_social", "v114_6_otro_prof",
  ] as unknown as (keyof CACRecord)[];
  const paliativosVars = Array.from({length:6}, (_,i) => `V114.${i+1}`);
  const paliativosActive = valoradoPaliativos === 1;
  if (paliativosActive) paliativosFields.forEach(f => activeFields.add(f));
  groupSummary["cuidados_paliativos"] = {
    description: "Tipos profesional cuidado paliativo (V114.1-V114.6)",
    active: paliativosActive,
    activeCount: paliativosActive ? 6 : 0,
    totalCount: 6,
    variables: paliativosActive ? paliativosVars : [],
  };

  return { activeFields, groupSummary };
}

/**
 * Verifica si un campo de un registro está "activo" (debe validarse).
 * Usar en el engine para omitir sub-variables inactivas.
 */
export function isFieldActive(
  record: CACRecord,
  fieldKey: keyof CACRecord,
  activeFields: Set<keyof CACRecord>,
): boolean {
  // Si el campo no pertenece a ningún grupo dinámico, siempre está activo
  const dynamicPrefixes = ["v46_", "v53_", "v54_", "v55_", "v56_",
    "v66_", "v67_", "v68_", "v69_", "v114_"];
  const key = fieldKey as string;
  const isDynamic = dynamicPrefixes.some(p => key.startsWith(p));
  if (!isDynamic) return true;
  return activeFields.has(fieldKey);
}
