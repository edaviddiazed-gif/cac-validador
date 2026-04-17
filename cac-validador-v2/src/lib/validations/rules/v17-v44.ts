/**
 * Reglas V17-V44: Diagnóstico, estadificación y antecedentes oncológicos.
 * SECCIÓN CRÍTICA — reglas de CIE-10, HER2, Gleason, TNM.
 * @module lib/validations/rules/v17-v44
 */

import type { ValidationRule } from "../types";
import {
  valid,
  invalid,
  isEmpty,
  isValidDate,
  isComodin,
  numericInRangeOrNA,
} from "../helpers";

export const rulesV17V44: ValidationRule[] = [
  // V17: CIE-10 — requerido + rango catálogo
  {
    variable: 17,
    name: "cie10_requerido",
    type: "requerido",
    validate: (value) => {
      if (isEmpty(value)) {
        return invalid("V17 Diagnóstico CIE-10 es obligatorio");
      }
      return valid();
    },
  },
  {
    variable: 17,
    name: "cie10_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value)) return valid();
      // CIE-10: letra + 2-4 caracteres alfanuméricos
      if (!/^[A-Z]\d{2}(\.\d{1,2})?$/i.test(value)) {
        return invalid(
          `V17 CIE-10 "${value}" no tiene formato válido (ej: C50.9, D05)`,
        );
      }
      return valid();
    },
  },
  {
    variable: 17,
    name: "cie10_catalogo",
    type: "rango",
    validate: (value, _row, ctx) => {
      if (isEmpty(value)) return valid();
      if (ctx.catalogos.cie10.size > 0 && !ctx.catalogos.cie10.has(value)) {
        return invalid(
          `V17 CIE-10 "${value}" no existe en catálogo operativo CAC`,
          `Buscar código correcto en catálogo CIE-10 CAC`,
        );
      }
      return valid();
    },
  },

  // V18: Fecha diagnóstico — requerido + formato
  {
    variable: 18,
    name: "fecha_diagnostico_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value)) {
        return invalid("V18 Fecha diagnóstico es obligatoria");
      }
      if (!isValidDate(value)) {
        return invalid(
          `V18 Fecha diagnóstico "${value}" no tiene formato AAAA-MM-DD`,
        );
      }
      return valid();
    },
  },

  // V21: Base del diagnóstico — rango 1-10
  {
    variable: 21,
    name: "base_diagnostico_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return invalid("V21 Base diagnóstico debe ser numérico");
      return numericInRangeOrNA(num, 1, 10, "V21 Base diagnóstico", [98]);
    },
  },

  // V22: Grado diferenciación — rango
  {
    variable: 22,
    name: "grado_diferenciacion_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid(); // puede ser vacío
      return numericInRangeOrNA(num, 1, 9, "V22 Grado diferenciación", [98]);
    },
  },

  // V23: Lateralidad — rango
  {
    variable: 23,
    name: "lateralidad_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      const validos = new Set([1, 2, 3, 98]);
      if (!validos.has(num)) {
        return invalid(
          `V23 Lateralidad "${value}" no válida`,
          "1=Der, 2=Izq, 3=Bilateral, 98=NA",
        );
      }
      return valid();
    },
  },

  // V24: Fecha biopsia — formato fecha
  {
    variable: 24,
    name: "fecha_biopsia_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(
          `V24 Fecha biopsia "${value}" no tiene formato AAAA-MM-DD`,
        );
      }
      return valid();
    },
  },

  // V29: Estadificación — rango 0-20+
  {
    variable: 29,
    name: "estadificacion_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 0, 99, "V29 Estadificación", [98, 97]);
    },
  },

  // V31: HER2 realizado — solo mama (se valida en cross)
  {
    variable: 31,
    name: "her2_realizado_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 3, "V31 HER2 realizado", [98]);
    },
  },

  // V32: HER2 fecha
  {
    variable: 32,
    name: "her2_fecha_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V32 Fecha HER2 "${value}" formato inválido`);
      }
      return valid();
    },
  },

  // V33: HER2 resultado — rango
  {
    variable: 33,
    name: "her2_resultado_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 4, "V33 HER2 resultado", [98]);
    },
  },

  // V37: Gleason — solo próstata (se valida en cross)
  {
    variable: 37,
    name: "gleason_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 2, 10, "V37 Gleason", [98]);
    },
  },

  // V38: PSA — numérico
  {
    variable: 38,
    name: "psa_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value)) return valid();
      const num = parseFloat(value);
      if (isNaN(num) && value !== "98") {
        return invalid(
          `V38 PSA "${value}" no es numérico válido`,
        );
      }
      return valid();
    },
  },

  // V39: PSA fecha
  {
    variable: 39,
    name: "psa_fecha_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V39 Fecha PSA "${value}" formato inválido`);
      }
      return valid();
    },
  },
];
