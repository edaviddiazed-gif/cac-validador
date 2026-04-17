/**
 * Reglas V106-V110: Trasplante de células progenitoras hematopoyéticas.
 * @module lib/validations/rules/v106-v110
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

export const rulesV106V110: ValidationRule[] = [
  {
    variable: 106,
    name: "recibio_trasplante_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2, 98].includes(num)) {
        return invalid(`V106 Recibió trasplante "${value}" no válido`, "1=Sí, 2=No, 98=NA");
      }
      return valid();
    },
  },
  {
    variable: 107,
    name: "fecha_trasplante_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V107 Fecha trasplante "${value}" formato inválido`);
      }
      return valid();
    },
  },
  {
    variable: 108,
    name: "tipo_trasplante_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 3, "V108 Tipo trasplante", [98]);
    },
  },
  {
    variable: 110,
    name: "estado_trasplante_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V110 Estado trasplante", [98, 97]);
    },
  },
];
