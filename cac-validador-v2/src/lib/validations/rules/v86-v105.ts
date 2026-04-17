/**
 * Reglas V86-V105: Radioterapia (primer y último esquema + braquiterapia).
 * @module lib/validations/rules/v86-v105
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

export const rulesV86V105: ValidationRule[] = [
  // V86: Recibió radioterapia
  {
    variable: 86,
    name: "recibio_rt_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2, 98].includes(num)) {
        return invalid(`V86 Recibió RT "${value}" no válido`, "1=Sí, 2=No, 98=NA");
      }
      return valid();
    },
  },

  // V87: Fecha inicio RT
  {
    variable: 87,
    name: "fecha_inicio_rt_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V87 Fecha inicio RT "${value}" formato inválido`);
      }
      return valid();
    },
  },

  // V88: Tipo RT — rango
  {
    variable: 88,
    name: "tipo_rt_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V88 Tipo RT", [98]);
    },
  },

  // V89: Dosis total RT — numérico positivo
  {
    variable: 89,
    name: "dosis_rt_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || value === "98") return valid();
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return invalid(`V89 Dosis total RT "${value}" no es numérico válido`);
      }
      return valid();
    },
  },

  // V90: Sesiones RT — numérico positivo
  {
    variable: 90,
    name: "sesiones_rt_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 99, "V90 Sesiones RT", [98, 97]);
    },
  },

  // V93: Intención RT
  {
    variable: 93,
    name: "intencion_rt_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V93 Intención RT", [98]);
    },
  },

  // V99: Estado RT
  {
    variable: 99,
    name: "estado_rt_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V99 Estado RT", [98, 97]);
    },
  },

  // V100: Recibió braquiterapia
  {
    variable: 100,
    name: "recibio_braqui_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2, 98].includes(num)) {
        return invalid(`V100 Recibió braquiterapia "${value}" no válido`, "1=Sí, 2=No, 98=NA");
      }
      return valid();
    },
  },

  // V105: Estado braquiterapia
  {
    variable: 105,
    name: "estado_braquiterapia_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V105 Estado braquiterapia", [98, 97]);
    },
  },
];
