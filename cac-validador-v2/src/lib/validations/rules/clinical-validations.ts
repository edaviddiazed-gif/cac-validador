/**
 * Validaciones clínicas por tipo de cáncer — portado de v1 (clinicos.py).
 * Coherencia clínica según CIE-10: Dukes, Ann Arbor, Gleason, HER2,
 * catálogo CIE-10/CUPS/ATC, histopatología, hematolinfáticos.
 *
 * @module lib/validations/rules/clinical-validations
 */

import type { CACRecord } from "@/types/cac";
import type { ValidationRule } from "../types";
import type { ValidationCatalogs } from "../types";
import { valid, invalid, isEmpty } from "../helpers";

// ─── Prefijos CIE-10 por tipo tumoral ──────────────────────────────────────

const CIE_MAMA            = ["C50"];
const CIE_COLORRECTAL     = ["C18","C19","C20"];
const CIE_PROSTATA        = ["C61"];
const CIE_LINFOMA_MIELOMA = ["C81","C82","C83","C84","C85","C90"];
const CIE_LEUCEMIA        = ["C91","C92","C93","C94","C95"];
const CIE_HEMATOLINFATICO = [...CIE_LINFOMA_MIELOMA, ...CIE_LEUCEMIA];
const CIE_SNC             = ["C70","C71","C72"];

// CIE-10 exclusivos por sexo — tomados del Excel Res. 0247
const CIE_SOLO_MASCULINO = new Set([
  "C600","C601","C602","C608","C609","C61X","C61",
  "C620","C621","C629","C630","C631","C632","C637","C638","C639",
  "D074","D075","D076",
]);

const CIE_SOLO_FEMENINO = new Set([
  "C510","C511","C512","C518","C519","C52X","C52",
  "C530","C531","C538","C539","C540","C541","C542","C543","C548","C549",
  "C55X","C55","C56X","C56","C570","C571","C572","C573","C574","C577","C578","C579","C58X","C58",
  "D060","D061","D067","D069","D070","D071","D072","D073",
]);

// ─── Helpers ───────────────────────────────────────────────────────────────

function startsWith(cie: string, prefixes: string[]): boolean {
  const upper = (cie || "").toUpperCase();
  return prefixes.some(p => upper.startsWith(p));
}

function isNA(val: string | number | null | undefined): boolean {
  return val === null || val === undefined || String(val).trim() === ""
    || ["98","55",""].includes(String(val).trim());
}

function hasRealValue(val: string | number | null | undefined): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  return s !== "" && !["55","98","99","97","96"].includes(s);
}

// ─── Reglas clínicas ──────────────────────────────────────────────────────

export const clinicalValidationRules: ValidationRule[] = [

  // ══════════════════════════════════════════════════════════════════════
  // R-CIE-CAC: V17 debe estar en el catálogo oficial del Excel
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 17,
    name: "cie10_en_catalogo_cac",
    type: "codificacion",
    severity: "error",
    validate: (value, _row, context) => {
      if (isEmpty(value)) return valid();
      const cats = context.catalogos as ValidationCatalogs;
      if (cats.cie10.size === 0) return valid(); // catálogo no cargado aún
      if (!cats.cie10.has(value.toUpperCase())) {
        return invalid(
          `V17 CIE-10 "${value}" no está en el catálogo de neoplasias válidas del CAC (Res. 0247)`,
          "Verifique el código CIE-10 contra el Excel oficial de validación",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-SEXO-M: CIE-10 exclusivo masculino en paciente femenina
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 17,
    name: "cie10_exclusivo_masculino_coherente",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const cie10 = String(row.v17_cie10 || "").toUpperCase();
      const sexo  = String(row.v08_sexo || "").toUpperCase();
      if (isEmpty(cie10) || isEmpty(sexo)) return valid();
      if (CIE_SOLO_MASCULINO.has(cie10) && sexo !== "M") {
        return invalid(
          `V17="${cie10}" es un tumor exclusivo masculino (próstata/pene/testículo) pero V8="${sexo}"`,
          "Verifique el CIE-10 o el sexo del paciente (regla B4811 del Excel de validación)",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-SEXO-F: CIE-10 exclusivo femenino en paciente masculino
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 17,
    name: "cie10_exclusivo_femenino_coherente",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const cie10 = String(row.v17_cie10 || "").toUpperCase();
      const sexo  = String(row.v08_sexo || "").toUpperCase();
      if (isEmpty(cie10) || isEmpty(sexo)) return valid();
      if (CIE_SOLO_FEMENINO.has(cie10) && sexo !== "F") {
        return invalid(
          `V17="${cie10}" es un tumor exclusivo femenino (útero/ovario/cérvix/vulva) pero V8="${sexo}"`,
          "Verifique el CIE-10 o el sexo del paciente (regla B4811 del Excel de validación)",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-030: Mama → HER2 requerido (V31)
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 31,
    name: "her2_requerido_mama",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const cie10 = String(row.v17_cie10 || "");
      const her2  = String(row.v31_her2_realizado ?? "");
      if (!startsWith(cie10, CIE_MAMA)) return valid();
      // In situ (D50...) no requiere HER2
      if (cie10.toUpperCase().startsWith("D")) return valid();
      if (isNA(her2)) {
        return invalid(
          "V17 es cáncer de mama (C50.x) que no es in situ — V31 HER2 no puede ser 98/vacío",
          "Registre si se realizó la prueba HER2 en la variable 31",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-031: Colorrectal → Dukes requerido (V34)
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 34,
    name: "dukes_requerido_colorrectal",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const cie10 = String(row.v17_cie10 || "");
      const dukes = (row as any).v34_estadificacion_dukes;
      if (!startsWith(cie10, CIE_COLORRECTAL)) return valid();
      if (isNA(dukes)) {
        return invalid(
          `V17="${cie10}" es cáncer colorrectal — V34 estadificación Dukes no puede ser 98/vacío`,
          "Registre la estadificación de Dukes en la variable 34",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-032: Próstata → Gleason requerido (V37)
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 37,
    name: "gleason_requerido_prostata",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const cie10   = String(row.v17_cie10 || "");
      const gleason = row.v37_gleason;
      if (!startsWith(cie10, CIE_PROSTATA)) return valid();
      if (isNA(gleason)) {
        return invalid(
          `V17="${cie10}" es cáncer de próstata — V37 Gleason no puede ser 98/vacío`,
          "Registre la clasificación Gleason en la variable 37",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-033: Linfoma/Mieloma → Ann Arbor / Lugano requerido (V36)
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 36,
    name: "ann_arbor_requerido_linfoma",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const cie10    = String(row.v17_cie10 || "");
      const annArbor = (row as any).v36_ann_arbor_lugano;
      if (!startsWith(cie10, CIE_LINFOMA_MIELOMA)) return valid();
      if (isNA(annArbor)) {
        return invalid(
          `V17="${cie10}" es linfoma/mieloma — V36 Ann Arbor/Lugano no puede ser 98/vacío`,
          "Registre la estadificación Ann Arbor o Lugano en la variable 36",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-034: V21=7 (diagnóstico clínico sin histo) → V22 motivo requerido
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 22,
    name: "motivo_sin_histo_requerido_v21_7",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const base  = String(row.v21_base_diagnostico ?? "");
      const motivo = String((row as any).v22_motivo_sin_histopatologia ?? "");
      if (base !== "7") return valid();
      if (!hasRealValue(motivo) || motivo === "98") {
        return invalid(
          "V21=7 (diagnóstico clínico sin histopatología) — V22 motivo de ausencia es obligatorio",
          "Registre el motivo en V22 cuando V21=7",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-050: V21 ≠ 7 → V22 debe ser 98
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 22,
    name: "motivo_sin_histo_debe_ser_na",
    type: "negocio",
    severity: "warning",
    validate: (_value, row) => {
      const base   = String(row.v21_base_diagnostico ?? "");
      const motivo = String((row as any).v22_motivo_sin_histopatologia ?? "");
      if (base === "7" || base === "") return valid();
      if (hasRealValue(motivo) && motivo !== "98") {
        return invalid(
          `V21=${base} (se realizó histopatología) — V22 motivo debería ser 98 (NA), tiene "${motivo}"`,
          "Si hubo histopatología, V22 debe ser 98",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-051: V21=7 → V23 fecha recolección muestra debe ser 1845-01-01
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 23,
    name: "fecha_muestra_na_sin_histo",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const base       = String(row.v21_base_diagnostico ?? "");
      const fechaMuest = String((row as any).v23_fecha_recoleccion_muestra ?? "");
      if (base !== "7") return valid();
      if (fechaMuest && !["1845-01-01","1846-01-01","","1800-01-01"].includes(fechaMuest)) {
        return invalid(
          `V21=7 (sin histopatología) — V23 fecha recolección muestra debería ser 1845-01-01, tiene "${fechaMuest}"`,
          "Use el comodín 1845-01-01 cuando no aplica histopatología",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-052: Hematolinfáticos / SNC → TNM debe ser 98 (no aplica)
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 29,
    name: "tnm_debe_ser_na_hematolinfatico",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const cie10 = String(row.v17_cie10 || "");
      const tnm   = row.v29_estadificacion;
      if (!startsWith(cie10, [...CIE_HEMATOLINFATICO, ...CIE_SNC])) return valid();
      if (hasRealValue(tnm) && String(tnm) !== "98") {
        return invalid(
          `V17="${cie10}" es hematolinfático/SNC — V29 estadificación TNM/FIGO no aplica (debe ser 98)`,
          "Para cáncer hematológico o SNC use 98 en V29 y registre Ann Arbor/Lugano en V36",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-035: Recibió QT (V45=1) → debe tener primer esquema con fecha e IPS
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 49,
    name: "qt_requiere_fecha_inicio_primer_esquema",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      const recibioQt = String(row.v45_recibio_qs ?? "");
      if (recibioQt !== "1") return valid();
      const fechaInicio = String(row.v46_fecha_inicio_qs ?? "");
      if (!fechaInicio || ["1845-01-01","","1800-01-01"].includes(fechaInicio)) {
        return invalid(
          "V45=1 (recibió terapia sistémica) — V46 fecha inicio primer esquema es obligatoria",
          "Registre la fecha de inicio del primer esquema de quimioterapia en V46",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-ATC: Medicamentos ATC deben estar en catálogo oficial
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 53,
    name: "atc_primer_esquema_en_catalogo",
    type: "codificacion",
    severity: "warning",
    validate: (_value, row, context) => {
      const cats = context.catalogos as ValidationCatalogs;
      if (cats.atc.size === 0) return valid();
      // Revisar primer medicamento del primer esquema como representativo
      const med1 = String(row.v53_1_med_atc_primer ?? "").trim();
      if (!med1 || ["98","97",""].includes(med1)) return valid();
      if (!cats.atc.has(med1.toUpperCase())) {
        return invalid(
          `V53.1 código ATC "${med1}" no está en el catálogo oficial del CAC`,
          "Verifique el código ATC del medicamento contra el Excel de validación",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-CUPS: Procedimientos quirúrgicos deben estar en catálogo CUPS
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 76,
    name: "cups_cirugia_en_catalogo",
    type: "codificacion",
    severity: "warning",
    validate: (_value, row, context) => {
      const cats  = context.catalogos as ValidationCatalogs;
      if (cats.cups.size === 0) return valid();
      const recibio = String(row.v74_recibio_cirugia ?? "");
      if (recibio !== "1") return valid();
      const cups = String(row.v76_cups_cirugia ?? "").trim();
      if (!cups || ["98","97",""].includes(cups)) return valid();
      if (!cats.cups.has(cups.toUpperCase())) {
        return invalid(
          `V76 código CUPS cirugía "${cups}" no está en el catálogo oficial`,
          "Verifique el código CUPS contra el Excel de validación",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-NOVED-ALTA: V128=5 (alta curada) → V126 debe ser 1 (vivo)
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 128,
    name: "alta_curada_requiere_vivo",
    type: "novedad",
    severity: "error",
    validate: (_value, row) => {
      const novedad = String(row.v128_novedad_admin ?? "");
      const estado  = String(row.v126_estado_vital ?? "");
      if (novedad !== "5") return valid();
      if (estado !== "1") {
        return invalid(
          `V128=5 (alta curada) pero V126 estado vital="${estado}" — debe ser 1 (vivo)`,
          "Si la novedad es alta curada, el paciente debe estar vivo",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-NOVED-PERD: V128=6 (pérdida seguimiento) → V131 puede ser 1800
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 128,
    name: "perdida_seguimiento_fecha_coherente",
    type: "novedad",
    severity: "warning",
    validate: (_value, row) => {
      const novedad = String(row.v128_novedad_admin ?? "");
      if (novedad !== "6") return valid();
      const estado = String(row.v126_estado_vital ?? "");
      if (estado === "2") {
        return invalid(
          "V128=6 (pérdida seguimiento) pero V126=2 (fallecido) — incoherente",
          "Un paciente con pérdida de seguimiento no puede estar registrado como fallecido",
        );
      }
      return valid();
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // R-PALIATIVOS: V113=1 (valorado) → al menos un V114.x debe ser 1
  // ══════════════════════════════════════════════════════════════════════
  {
    variable: 113,
    name: "paliativo_valorado_requiere_tipo_profesional",
    type: "negocio",
    severity: "warning",
    validate: (_value, row) => {
      const valorado = String(row.v113_paliativo ?? "");
      if (valorado !== "1") return valid();
      const anyRow = row as any;
      const campos = [
        anyRow.v114_1_med_especialista_paliativo,
        anyRow.v114_2_prof_especialista_paliativo,
        anyRow.v114_3_med_especialista_otra,
        anyRow.v114_4_med_general,
        anyRow.v114_5_trabajo_social,
        anyRow.v114_6_otro_prof,
      ] as (string | number | null | undefined)[];
      const hayUno = campos.some(c => String(c ?? "").trim() === "1");
      if (!hayUno) {
        return invalid(
          "V113=1 (valorado en cuidado paliativo) pero ningún V114.x tiene valor 1",
          "Registre al menos un tipo de profesional en cuidado paliativo (V114.1-V114.6)",
        );
      }
      return valid();
    },
  },
];
