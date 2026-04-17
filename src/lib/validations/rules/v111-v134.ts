/**
 * Reglas V111-V134: Tratamiento complementario + situación actual + novedades.
 * V128 (novedad administrativa) es la variable más crítica del reporte.
 * @module lib/validations/rules/v111-v134
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

const NOVEDADES_ADMIN_VALIDAS = new Set([1, 2, 3, 4, 5, 6, 12, 16]);

export const rulesV111V134: ValidationRule[] = [
  // V111-V124: Complementarios — rangos 1=Sí, 2=No, 98=NA
  ...[111, 113, 116, 118, 120, 122, 123, 124].map(
    (v): ValidationRule => ({
      variable: v,
      name: `complementario_v${v}_rango`,
      type: "rango",
      validate: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return valid();
        if (![1, 2, 98].includes(num)) {
          return invalid(`V${v} valor "${value}" no válido`, "1=Sí, 2=No, 98=NA");
        }
        return valid();
      },
    }),
  ),

  // V125: Último contacto — formato fecha
  {
    variable: 125,
    name: "ultimo_contacto_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V125 Último contacto "${value}" formato inválido`);
      }
      return valid();
    },
  },

  // V126: Estado vital — rango
  {
    variable: 126,
    name: "estado_vital_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2].includes(num)) {
        return invalid(`V126 Estado vital "${value}" no válido`, "1=Vivo, 2=Fallecido");
      }
      return valid();
    },
  },

  // V127: ECOG — rango 0-5
  {
    variable: 127,
    name: "ecog_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 0, 5, "V127 ECOG", [98]);
    },
  },

  // V128: Novedad administrativa — CRÍTICA
  {
    variable: 128,
    name: "novedad_admin_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        return invalid("V128 Novedad administrativa es obligatoria y debe ser numérica");
      }
      if (!NOVEDADES_ADMIN_VALIDAS.has(num)) {
        return invalid(
          `V128 Novedad administrativa "${value}" no válida`,
          `Valores: ${[...NOVEDADES_ADMIN_VALIDAS].join(", ")}`,
        );
      }
      return valid();
    },
  },

  // V131: Fecha muerte — formato
  {
    variable: 131,
    name: "fecha_muerte_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V131 Fecha muerte "${value}" formato inválido`);
      }
      return valid();
    },
  },

  // V134: Fecha corte — requerido + formato
  {
    variable: 134,
    name: "fecha_corte_requerida",
    type: "requerido",
    validate: (value) => {
      if (isEmpty(value)) {
        return invalid("V134 Fecha corte es obligatoria");
      }
      if (!isValidDate(value)) {
        return invalid(`V134 Fecha corte "${value}" formato inválido`);
      }
      return valid();
    },
  },
];
