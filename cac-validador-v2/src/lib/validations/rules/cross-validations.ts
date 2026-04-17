/**
 * Validaciones cruzadas entre variables.
 * Estas son las reglas más críticas del motor — verifican coherencia
 * entre campos relacionados según la Resolución 0247/2014.
 * @module lib/validations/rules/cross-validations
 */

import { COMODINES_FECHA } from "@/types/cac";
import type { ValidationRule } from "../types";
import { valid, invalid, isEmpty, isComodin } from "../helpers";

export const crossValidationRules: ValidationRule[] = [
  // ═══════════════════════════════════════════════
  // REGLA 1: V17↔V29 — CIE-10 "D" (in situ) → estadio debe ser 0
  // ═══════════════════════════════════════════════
  {
    variable: 17,
    name: "cie10_insitu_estadio_coherente",
    type: "cruce",
    severity: "error",
    validate: (_value, row) => {
      const cie10 = row.v17_cie10;
      const estadio = row.v29_estadificacion;
      if (isEmpty(cie10)) return valid();
      if (cie10.startsWith("D") && estadio !== 0 && estadio !== 98) {
        return invalid(
          `CIE-10 "${cie10}" (in situ) pero estadio = ${estadio}. Debería ser 0`,
          "Para diagnóstico in situ (D00-D09), el estadio debe ser 0",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 2: V18=V24 — Fecha diagnóstico = fecha biopsia cuando
  //          base diagnóstico es histopatológico (V21=5,9,10)
  // ═══════════════════════════════════════════════
  {
    variable: 18,
    name: "fecha_diagnostico_coincide_biopsia",
    type: "cruce",
    severity: "warning",
    validate: (_value, row) => {
      const baseDx = row.v21_base_diagnostico;
      const fechaDx = row.v18_fecha_diagnostico;
      const fechaBx = row.v24_fecha_biopsia;
      if (![5, 9, 10].includes(baseDx)) return valid();
      if (isComodin(fechaDx) || isComodin(fechaBx)) return valid();
      if (fechaDx !== fechaBx) {
        return invalid(
          `V18 fecha diagnóstico (${fechaDx}) ≠ V24 fecha biopsia (${fechaBx}) con base histopatológica`,
          "Cuando la base de diagnóstico es histopatológica (5,9,10), las fechas deberían coincidir",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 3: V128=4 (fallecido) → V131 y V132 no comodín
  // ═══════════════════════════════════════════════
  {
    variable: 128,
    name: "fallecido_requiere_fecha_muerte",
    type: "novedad",
    severity: "error",
    validate: (_value, row) => {
      if (row.v128_novedad_admin !== 4) return valid();
      const fechaMuerte = row.v131_fecha_muerte;
      if (isEmpty(fechaMuerte) || fechaMuerte === COMODINES_FECHA.DESCONOCIDO) {
        return invalid(
          "V128=4 (fallecido) pero V131 (fecha muerte) está vacía o es desconocida",
          "Ingrese la fecha real de muerte del paciente",
        );
      }
      return valid();
    },
  },
  {
    variable: 128,
    name: "fallecido_requiere_causa_muerte",
    type: "novedad",
    severity: "error",
    validate: (_value, row) => {
      if (row.v128_novedad_admin !== 4) return valid();
      const causa = row.v132_causa_muerte;
      if (causa === 0 || causa === 98) {
        return invalid(
          "V128=4 (fallecido) pero V132 (causa muerte) = 0 o 98",
          "Debe reportar la causa de muerte real",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 4: V128=2 (caso nuevo) → V18 NO puede ser 1800-01-01
  // ═══════════════════════════════════════════════
  {
    variable: 128,
    name: "caso_nuevo_requiere_fecha_diagnostico",
    type: "novedad",
    severity: "error",
    validate: (_value, row) => {
      if (row.v128_novedad_admin !== 2) return valid();
      if (row.v18_fecha_diagnostico === COMODINES_FECHA.DESCONOCIDO) {
        return invalid(
          "V128=2 (caso nuevo) pero V18 (fecha diagnóstico) = 1800-01-01 (desconocido)",
          "Los casos nuevos deben tener fecha de diagnóstico real",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 5: V21=7 → V22 ≠ 98
  // ═══════════════════════════════════════════════
  {
    variable: 21,
    name: "base_dx_requiere_grado",
    type: "cruce",
    severity: "error",
    validate: (_value, row) => {
      if (row.v21_base_diagnostico !== 7) return valid();
      if (row.v22_grado_diferenciacion === 98) {
        return invalid(
          "V21=7 (base diagnóstico histológica) pero V22 (grado) = 98 (NA)",
          "Si la base diagnóstica es histológica, debe reportar el grado",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 6: V45=98 → V46-V73 deben ser 98/97
  // ═══════════════════════════════════════════════
  {
    variable: 45,
    name: "sin_qs_variables_na",
    type: "negocio",
    severity: "error",
    validate: (_value, row) => {
      if (row.v45_recibio_qs !== 98) return valid();
      // Si no recibió QS, las fechas deben ser comodín NA
      const fechaQS = row.v46_fecha_inicio_qs;
      if (!isEmpty(fechaQS) && !isComodin(fechaQS)) {
        return invalid(
          "V45=98 (no recibió QS) pero V46 tiene fecha real",
          "Si V45=98, todas las variables V46-V73 deben ser 98/97 o comodín NA",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 7: V31-V33 solo aplican si V17 es mama (C50x)
  // ═══════════════════════════════════════════════
  {
    variable: 31,
    name: "her2_solo_mama",
    type: "negocio",
    severity: "warning",
    validate: (_value, row) => {
      const cie10 = row.v17_cie10;
      const her2 = row.v31_her2_realizado;
      if (isEmpty(cie10)) return valid();
      const esMama = cie10.startsWith("C50");
      if (!esMama && her2 !== 98 && her2 !== 0) {
        return invalid(
          `V31 HER2 realizado (${her2}) reportado para CIE-10 no-mama ("${cie10}")`,
          "HER2 solo aplica para cáncer de mama (C50.x). Use 98 (NA)",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 8: V37 solo aplica si V17 es próstata (C61)
  // ═══════════════════════════════════════════════
  {
    variable: 37,
    name: "gleason_solo_prostata",
    type: "negocio",
    severity: "warning",
    validate: (_value, row) => {
      const cie10 = row.v17_cie10;
      const gleason = row.v37_gleason;
      if (isEmpty(cie10)) return valid();
      const esProstata = cie10 === "C61";
      if (!esProstata && gleason !== 98 && gleason !== 0) {
        return invalid(
          `V37 Gleason (${gleason}) reportado para CIE-10 no-próstata ("${cie10}")`,
          "Gleason solo aplica para próstata (C61). Use 98 (NA)",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 9: V126↔V128 — Estado vital coherente con novedad
  // ═══════════════════════════════════════════════
  {
    variable: 126,
    name: "estado_vital_coherente_novedad",
    type: "cruce",
    severity: "error",
    validate: (_value, row) => {
      if (row.v128_novedad_admin === 4 && row.v126_estado_vital !== 2) {
        return invalid(
          `V128=4 (fallecido) pero V126 (estado vital) = ${row.v126_estado_vital} (no fallecido)`,
          "Si la novedad es 4 (fallecido), el estado vital debe ser 2",
        );
      }
      return valid();
    },
  },

  // ═══════════════════════════════════════════════
  // REGLA 10: V08↔V17 — Sexo ↔ Diagnóstico coherente
  // ═══════════════════════════════════════════════
  {
    variable: 8,
    name: "sexo_diagnostico_coherente",
    type: "negocio",
    severity: "warning",
    validate: (_value, row) => {
      const cie10 = row.v17_cie10;
      const sexo = row.v08_sexo;
      if (isEmpty(cie10)) return valid();

      // Cáncer de próstata en mujer
      if (cie10 === "C61" && sexo === "F") {
        return invalid(
          `V17=C61 (próstata) incompatible con V08=F (femenino)`,
          "Cáncer de próstata no aplica para pacientes femeninas",
        );
      }
      // Cáncer de cérvix en hombre
      if (cie10.startsWith("C53") && sexo === "M") {
        return invalid(
          `V17=${cie10} (cérvix) incompatible con V08=M (masculino)`,
          "Cáncer de cérvix no aplica para pacientes masculinos",
        );
      }
      return valid();
    },
  },
];
