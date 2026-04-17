/**
 * Reglas V45-V73: Terapia sistémica (quimioterapia, hormonoterapia, inmunoterapia).
 * Incluye validación de medicamentos ATC y sub-variables V53.1-V53.8.
 * @module lib/validations/rules/v45-v73
 */

import type { CACRecord } from "@/types/cac";
import type { ValidationRule } from "../types";
import {
  valid,
  invalid,
  isEmpty,
  isValidDate,
  isComodin,
  numericInRangeOrNA,
} from "../helpers";

/** Obtiene los medicamentos ATC del primer esquema como array */
function getMedsFirstScheme(row: CACRecord): string[] {
  return [
    row.v53_1_med_atc_primer,
    row.v53_2_med_atc_primer,
    row.v53_3_med_atc_primer,
    row.v53_4_med_atc_primer,
    row.v53_5_med_atc_primer,
    row.v53_6_med_atc_primer,
    row.v53_7_med_atc_primer,
    row.v53_8_med_atc_primer,
  ].filter((m) => !isEmpty(m) && m !== "98" && m !== "97");
}

export const rulesV45V73: ValidationRule[] = [
  // V45: Recibió QS — rango 1,2,98
  {
    variable: 45,
    name: "recibio_qs_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2, 98].includes(num)) {
        return invalid(
          `V45 Recibió QS "${value}" no válido`,
          "1=Sí, 2=No, 98=NA",
        );
      }
      return valid();
    },
  },

  // V46: Fecha inicio QS — formato
  {
    variable: 46,
    name: "fecha_inicio_qs_formato",
    type: "formato",
    validate: (value) => {
      if (isEmpty(value) || isComodin(value)) return valid();
      if (!isValidDate(value)) {
        return invalid(`V46 Fecha inicio QS "${value}" formato inválido`);
      }
      return valid();
    },
  },

  // V47: Número de ciclos — rango razonable
  {
    variable: 47,
    name: "num_ciclos_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 99, "V47 Número de ciclos", [98, 97]);
    },
  },

  // V48: Intención primer esquema
  {
    variable: 48,
    name: "intencion_primer_esquema_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 6, "V48 Intención primer esquema", [98]);
    },
  },

  // V53.x: Medicamentos ATC — no repetidos
  {
    variable: 53,
    name: "atc_primer_esquema_no_repetidos",
    type: "negocio",
    validate: (_value, row) => {
      const meds = getMedsFirstScheme(row);
      const unique = new Set(meds);
      if (unique.size < meds.length) {
        const duplicados = meds.filter(
          (m, i) => meds.indexOf(m) !== i,
        );
        return invalid(
          `V53 Medicamentos ATC repetidos: ${[...new Set(duplicados)].join(", ")}`,
          "Cada medicamento ATC debe aparecer una sola vez en el esquema",
        );
      }
      return valid();
    },
  },

  // V53.x: Medicamentos ATC — validar contra catálogo
  {
    variable: 53,
    name: "atc_primer_esquema_catalogo",
    type: "rango",
    validate: (_value, row, ctx) => {
      if (ctx.catalogos.atc.size === 0) return valid();
      const meds = getMedsFirstScheme(row);
      const invalids = meds.filter((m) => !ctx.catalogos.atc.has(m));
      if (invalids.length > 0) {
        return invalid(
          `V53 Códigos ATC no encontrados en catálogo: ${invalids.join(", ")}`,
          "Verifique los códigos ATC en el catálogo de medicamentos",
        );
      }
      return valid();
    },
  },

  // V54-V56: ATC último esquema — catálogo
  {
    variable: 54,
    name: "atc_ultimo_esquema_catalogo",
    type: "rango",
    validate: (_value, row, ctx) => {
      if (ctx.catalogos.atc.size === 0) return valid();
      const meds = [
        row.v54_med_atc_ultimo_1,
        row.v55_med_atc_ultimo_2,
        row.v56_med_atc_ultimo_3,
      ].filter((m) => !isEmpty(m) && m !== "98" && m !== "97");
      const invalids = meds.filter((m) => !ctx.catalogos.atc.has(m));
      if (invalids.length > 0) {
        return invalid(
          `V54-V56 Códigos ATC último esquema inválidos: ${invalids.join(", ")}`,
        );
      }
      return valid();
    },
  },

  // V59: Estado esquema — rango
  {
    variable: 59,
    name: "estado_esquema_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      return numericInRangeOrNA(num, 1, 5, "V59 Estado esquema QS", [98, 97]);
    },
  },

  // V60: Recibió hormonoterapia — rango
  {
    variable: 60,
    name: "recibio_hormono_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2, 98].includes(num)) {
        return invalid(`V60 Recibió hormonoterapia "${value}" no válido`, "1=Sí, 2=No, 98=NA");
      }
      return valid();
    },
  },

  // V68: Recibió inmunoterapia — rango
  {
    variable: 68,
    name: "recibio_inmuno_rango",
    type: "rango",
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return valid();
      if (![1, 2, 98].includes(num)) {
        return invalid(`V68 Recibió inmunoterapia "${value}" no válido`, "1=Sí, 2=No, 98=NA");
      }
      return valid();
    },
  },
];
