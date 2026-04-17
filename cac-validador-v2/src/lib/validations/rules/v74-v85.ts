/**
 * Reglas V74-V85: Cirugía (procedimientos CUPS).
 * @module lib/validations/rules/v74-v85
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

export const rulesV74V85: ValidationRule[] = [
  // V74: Recibió cirugía — rango
  {
    variable: 74,
    name: "recibio_cirugia_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2, 98].includes(num)) {
        return invalid(`V74 Recibió cirugía "${value}" no válido`, "1=Sí, 2=No, 98=NA");
      }
      return valid();
    },
  },

  // V75: Fecha cirugía — formato
  {
    variable: 75,
    name: "fecha_cirugia_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V75 Fecha cirugía "${value}" formato inválido`);
      }
      return valid();
    },
  },

  // V76: CUPS cirugía — catálogo
  {
    variable: 76,
    name: "cups_cirugia_catalogo",
    type: "rango",
    validate: (value, _row, ctx) => {
      if (isEmpty(value) || value === "98") return valid();
      if (ctx.catalogos.cups.size > 0 && !ctx.catalogos.cups.has(value)) {
        return invalid(
          `V76 CUPS cirugía "${value}" no existe en catálogo`,
          "Verifique el código CUPS del procedimiento quirúrgico",
        );
      }
      return valid();
    },
  },

  // V79: Intención cirugía — rango
  {
    variable: 79,
    name: "intencion_cirugia_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V79 Intención cirugía", [98]);
    },
  },

  // V81: CUPS última cirugía — catálogo
  {
    variable: 81,
    name: "cups_ultima_cirugia_catalogo",
    type: "rango",
    validate: (value, _row, ctx) => {
      if (isEmpty(value) || value === "98") return valid();
      if (ctx.catalogos.cups.size > 0 && !ctx.catalogos.cups.has(value)) {
        return invalid(
          `V81 CUPS última cirugía "${value}" no existe en catálogo`,
        );
      }
      return valid();
    },
  },

  // V82: Estado post cirugía — rango
  {
    variable: 82,
    name: "estado_post_cirugia_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V82 Estado post cirugía", [98, 97]);
    },
  },

  // V84: Ganglios evaluados — numérico ≥ 0
  {
    variable: 84,
    name: "ganglios_evaluados_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (num !== 98 && num !== 97 && num < 0) {
        return invalid(`V84 Ganglios evaluados no puede ser negativo`);
      }
      return valid();
    },
  },

  // V85: Ganglios positivos — ≤ V84
  {
    variable: 85,
    name: "ganglios_positivos_coherencia",
    type: "cruce",
    validate: (_value, row) => {
      const evaluados = row.v84_ganglios_evaluados;
      const positivos = row.v85_ganglios_positivos;
      if (evaluados === 98 || positivos === 98) return valid();
      if (evaluados === 97 || positivos === 97) return valid();
      if (positivos > evaluados) {
        return invalid(
          `V85 Ganglios positivos (${positivos}) > evaluados (${evaluados})`,
          "Los ganglios positivos no pueden exceder los evaluados",
        );
      }
      return valid();
    },
  },
];
