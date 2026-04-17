/**
 * Reglas V1-V16: Identificación EAPB y usuario.
 * @module lib/validations/rules/v01-v16
 */

import type { ValidationRule } from "../types";
import {
  valid,
  invalid,
  requiredField,
  isValidDate,
  isEmpty,
} from "../helpers";

const TIPOS_DOCUMENTO = new Set([
  "RC", "TI", "CC", "CE", "PA", "MS", "AS", "CD", "SC", "PE",
]);
const SEXOS = new Set(["M", "F", "I"]);
const REGIMENES = new Set(["C", "S", "P", "E", "N"]);

export const rulesV01V16: ValidationRule[] = [
  // V1: Primer nombre — requerido
  {
    variable: 1,
    name: "primer_nombre_requerido",
    type: "requerido",
    validate: (value) => requiredField(value, "V1 Primer nombre"),
  },

  // V3: Primer apellido — requerido
  {
    variable: 3,
    name: "primer_apellido_requerido",
    type: "requerido",
    validate: (value) => requiredField(value, "V3 Primer apellido"),
  },

  // V5: Tipo documento — rango
  {
    variable: 5,
    name: "tipo_documento_valido",
    type: "rango",
    validate: (value) => {
      if (isEmpty(value)) {
        return invalid("V5 Tipo documento es obligatorio");
      }
      if (!TIPOS_DOCUMENTO.has(value.toUpperCase())) {
        return invalid(
          `V5 Tipo documento "${value}" no es válido`,
          `Valores permitidos: ${[...TIPOS_DOCUMENTO].join(", ")}`,
        );
      }
      return valid();
    },
  },

  // V6: Número de ID — requerido
  {
    variable: 6,
    name: "numero_id_requerido",
    type: "requerido",
    validate: (value) => requiredField(value, "V6 Número de documento"),
  },

  // V7: Fecha nacimiento — formato fecha
  {
    variable: 7,
    name: "fecha_nacimiento_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value)) {
        return invalid("V7 Fecha nacimiento es obligatoria");
      }
      if (!isValidDate(value)) {
        return invalid(
          `V7 Fecha nacimiento "${value}" no tiene formato AAAA-MM-DD válido`,
        );
      }
      return valid();
    },
  },

  // V8: Sexo — rango
  {
    variable: 8,
    name: "sexo_valido",
    type: "rango",
    validate: (value) => {
      if (!SEXOS.has(value)) {
        return invalid(
          `V8 Sexo "${value}" no es válido`,
          "Valores: M=Masculino, F=Femenino, I=Indeterminado",
        );
      }
      return valid();
    },
  },

  // V10: Régimen — rango
  {
    variable: 10,
    name: "regimen_valido",
    type: "rango",
    validate: (value) => {
      if (!REGIMENES.has(value)) {
        return invalid(
          `V10 Régimen "${value}" no es válido`,
          "Valores: C=Contributivo, S=Subsidiado, P=Excepción, E=Especial, N=No asegurado",
        );
      }
      return valid();
    },
  },

  // V11: Código EAPB — requerido
  {
    variable: 11,
    name: "codigo_eapb_requerido",
    type: "requerido",
    validate: (value) => requiredField(value, "V11 Código EAPB"),
  },

  // V14: Municipio DIVIPOLA — formato
  {
    variable: 14,
    name: "municipio_divipola_formato",
    type: "formato",
    validate: (value, _row, ctx) => {
      if (isEmpty(value)) {
        return invalid("V14 Municipio residencia es obligatorio");
      }
      if (!/^\d{5}$/.test(value)) {
        return invalid(
          `V14 Municipio "${value}" no tiene formato DIVIPOLA (5 dígitos)`,
        );
      }
      if (ctx.catalogos.divipola.size > 0 && !ctx.catalogos.divipola.has(value)) {
        return invalid(
          `V14 Municipio "${value}" no existe en catálogo DIVIPOLA`,
          "Verifique el código DIVIPOLA del municipio",
        );
      }
      return valid();
    },
  },

  // V16: Fecha afiliación — formato fecha
  {
    variable: 16,
    name: "fecha_afiliacion_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value)) return valid(); // puede ser vacía
      if (!isValidDate(value)) {
        return invalid(
          `V16 Fecha afiliación "${value}" no tiene formato AAAA-MM-DD`,
        );
      }
      return valid();
    },
  },
];
