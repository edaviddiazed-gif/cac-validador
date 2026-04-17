/**
 * Mapeo de los 168 campos del archivo TXT → 134 variables CACRecord.
 * El índice del array corresponde a la posición de la columna (0-based).
 * @module lib/parsers/field-mapping
 */

import type { CACRecord } from "@/types/cac";

/** Definición de un campo del archivo */
export interface FieldDefinition {
  /** Posición en el archivo (0-based) */
  index: number;
  /** Nombre de la propiedad en CACRecord */
  key: keyof CACRecord;
  /** Tipo de dato esperado */
  dataType: "text" | "date" | "integer" | "numeric" | "char";
}

/**
 * Mapeo completo de 168 columnas a propiedades de CACRecord.
 * Campos 0-167 en el archivo → propiedades tipadas.
 */
export const FIELD_MAPPING: FieldDefinition[] = [
  // --- V1-V16: Identificación ---
  { index: 0, key: "v01_primer_nombre", dataType: "text" },
  { index: 1, key: "v02_segundo_nombre", dataType: "text" },
  { index: 2, key: "v03_primer_apellido", dataType: "text" },
  { index: 3, key: "v04_segundo_apellido", dataType: "text" },
  { index: 4, key: "v05_tipo_id", dataType: "char" },
  { index: 5, key: "v06_numero_id", dataType: "text" },
  { index: 6, key: "v07_fecha_nacimiento", dataType: "date" },
  { index: 7, key: "v08_sexo", dataType: "char" },
  { index: 8, key: "v09_ocupacion", dataType: "text" },
  { index: 9, key: "v10_regimen", dataType: "char" },
  { index: 10, key: "v11_codigo_eapb", dataType: "text" },
  { index: 11, key: "v12_pertenencia_etnica", dataType: "integer" },
  { index: 12, key: "v13_grupo_poblacional", dataType: "integer" },
  { index: 13, key: "v14_municipio_residencia", dataType: "text" },
  { index: 14, key: "v15_telefono", dataType: "text" },
  { index: 15, key: "v16_fecha_afiliacion", dataType: "date" },

  // --- V17-V44: Diagnóstico y estadificación ---
  { index: 16, key: "v17_cie10", dataType: "text" },
  { index: 17, key: "v18_fecha_diagnostico", dataType: "date" },
  { index: 18, key: "v19_medio_diagnostico", dataType: "integer" },
  { index: 19, key: "v20_topografia", dataType: "text" },
  { index: 20, key: "v21_base_diagnostico", dataType: "integer" },
  { index: 21, key: "v22_grado_diferenciacion", dataType: "integer" },
  { index: 22, key: "v23_lateralidad", dataType: "integer" },
  { index: 23, key: "v24_fecha_biopsia", dataType: "date" },
  { index: 24, key: "v25_ips_diagnostico", dataType: "text" },
  { index: 25, key: "v26_municipio_ips_diagnostico", dataType: "text" },
  { index: 26, key: "v27_histologia", dataType: "integer" },
  { index: 27, key: "v28_comportamiento", dataType: "integer" },
  { index: 28, key: "v29_estadificacion", dataType: "integer" },
  { index: 29, key: "v30_clasificacion_tnm", dataType: "text" },
  { index: 30, key: "v31_her2_realizado", dataType: "integer" },
  { index: 31, key: "v32_her2_fecha", dataType: "date" },
  { index: 32, key: "v33_her2_resultado", dataType: "integer" },
  { index: 33, key: "v34_receptores_estrogeno", dataType: "integer" },
  { index: 34, key: "v35_receptores_progesterona", dataType: "integer" },
  { index: 35, key: "v36_ki67", dataType: "integer" },
  { index: 36, key: "v37_gleason", dataType: "integer" },
  { index: 37, key: "v38_psa", dataType: "numeric" },
  { index: 38, key: "v39_psa_fecha", dataType: "date" },
  { index: 39, key: "v40_estadio_ann_arbor", dataType: "integer" },
  { index: 40, key: "v41_sintomas_b", dataType: "integer" },
  { index: 41, key: "v42_ipss", dataType: "integer" },
  { index: 42, key: "v43_compromiso_extranodal", dataType: "integer" },
  { index: 43, key: "v44_ldh", dataType: "integer" },

  // --- V45-V73: Terapia sistémica ---
  { index: 44, key: "v45_recibio_qs", dataType: "integer" },
  { index: 45, key: "v46_fecha_inicio_qs", dataType: "date" },
  { index: 46, key: "v47_num_ciclos", dataType: "integer" },
  { index: 47, key: "v48_intencion_primer_esquema", dataType: "integer" },
  { index: 48, key: "v49_ips_primer_esquema", dataType: "text" },
  { index: 49, key: "v50_municipio_ips_qs", dataType: "text" },
  { index: 50, key: "v51_fecha_inicio_ultimo_esquema", dataType: "date" },
  { index: 51, key: "v52_intencion_ultimo_esquema", dataType: "integer" },
  // V53 sub-variables (53.1-53.8)
  { index: 52, key: "v53_1_med_atc_primer", dataType: "text" },
  { index: 53, key: "v53_2_med_atc_primer", dataType: "text" },
  { index: 54, key: "v53_3_med_atc_primer", dataType: "text" },
  { index: 55, key: "v53_4_med_atc_primer", dataType: "text" },
  { index: 56, key: "v53_5_med_atc_primer", dataType: "text" },
  { index: 57, key: "v53_6_med_atc_primer", dataType: "text" },
  { index: 58, key: "v53_7_med_atc_primer", dataType: "text" },
  { index: 59, key: "v53_8_med_atc_primer", dataType: "text" },
  { index: 60, key: "v54_med_atc_ultimo_1", dataType: "text" },
  { index: 61, key: "v55_med_atc_ultimo_2", dataType: "text" },
  { index: 62, key: "v56_med_atc_ultimo_3", dataType: "text" },
  { index: 63, key: "v57_num_ciclos_ultimo", dataType: "integer" },
  { index: 64, key: "v58_fecha_ultimo_ciclo", dataType: "date" },
  { index: 65, key: "v59_estado_esquema", dataType: "integer" },
  { index: 66, key: "v60_recibio_hormonoterapia", dataType: "integer" },
  { index: 67, key: "v61_fecha_inicio_hormono", dataType: "date" },
  { index: 68, key: "v62_tipo_hormono", dataType: "integer" },
  { index: 69, key: "v63_med_hormono_1", dataType: "text" },
  { index: 70, key: "v64_med_hormono_2", dataType: "text" },
  { index: 71, key: "v65_med_hormono_3", dataType: "text" },
  { index: 72, key: "v66_fecha_ultimo_hormono", dataType: "date" },
  { index: 73, key: "v67_estado_hormono", dataType: "integer" },
  { index: 74, key: "v68_recibio_inmunoterapia", dataType: "integer" },
  { index: 75, key: "v69_fecha_inicio_inmuno", dataType: "date" },
  { index: 76, key: "v70_med_inmuno_1", dataType: "text" },
  { index: 77, key: "v71_med_inmuno_2", dataType: "text" },
  { index: 78, key: "v72_fecha_ultimo_inmuno", dataType: "date" },
  { index: 79, key: "v73_estado_inmuno", dataType: "integer" },

  // --- V74-V85: Cirugía ---
  { index: 80, key: "v74_recibio_cirugia", dataType: "integer" },
  { index: 81, key: "v75_fecha_cirugia", dataType: "date" },
  { index: 82, key: "v76_cups_cirugia", dataType: "text" },
  { index: 83, key: "v77_ips_cirugia", dataType: "text" },
  { index: 84, key: "v78_municipio_ips_cirugia", dataType: "text" },
  { index: 85, key: "v79_intencion_cirugia", dataType: "integer" },
  { index: 86, key: "v80_fecha_ultima_cirugia", dataType: "date" },
  { index: 87, key: "v81_cups_ultima_cirugia", dataType: "text" },
  { index: 88, key: "v82_estado_post_cirugia", dataType: "integer" },
  { index: 89, key: "v83_margen_quirurgico", dataType: "integer" },
  { index: 90, key: "v84_ganglios_evaluados", dataType: "integer" },
  { index: 91, key: "v85_ganglios_positivos", dataType: "integer" },

  // --- V86-V105: Radioterapia ---
  { index: 92, key: "v86_recibio_radioterapia", dataType: "integer" },
  { index: 93, key: "v87_fecha_inicio_rt", dataType: "date" },
  { index: 94, key: "v88_tipo_rt", dataType: "integer" },
  { index: 95, key: "v89_dosis_total_rt", dataType: "numeric" },
  { index: 96, key: "v90_num_sesiones_rt", dataType: "integer" },
  { index: 97, key: "v91_ips_rt", dataType: "text" },
  { index: 98, key: "v92_municipio_ips_rt", dataType: "text" },
  { index: 99, key: "v93_intencion_rt", dataType: "integer" },
  { index: 100, key: "v94_fecha_inicio_ultimo_rt", dataType: "date" },
  { index: 101, key: "v95_tipo_ultimo_rt", dataType: "integer" },
  { index: 102, key: "v96_dosis_ultimo_rt", dataType: "numeric" },
  { index: 103, key: "v97_num_sesiones_ultimo_rt", dataType: "integer" },
  { index: 104, key: "v98_fecha_ultimo_rt", dataType: "date" },
  { index: 105, key: "v99_estado_rt", dataType: "integer" },
  { index: 106, key: "v100_recibio_braquiterapia", dataType: "integer" },
  { index: 107, key: "v101_fecha_braquiterapia", dataType: "date" },
  { index: 108, key: "v102_tipo_braquiterapia", dataType: "integer" },
  { index: 109, key: "v103_dosis_braquiterapia", dataType: "numeric" },
  { index: 110, key: "v104_sesiones_braquiterapia", dataType: "integer" },
  { index: 111, key: "v105_estado_braquiterapia", dataType: "integer" },

  // --- V106-V110: Trasplante ---
  { index: 112, key: "v106_recibio_trasplante", dataType: "integer" },
  { index: 113, key: "v107_fecha_trasplante", dataType: "date" },
  { index: 114, key: "v108_tipo_trasplante", dataType: "integer" },
  { index: 115, key: "v109_ips_trasplante", dataType: "text" },
  { index: 116, key: "v110_estado_trasplante", dataType: "integer" },

  // --- V111-V124: Tratamiento complementario ---
  { index: 117, key: "v111_reconstructiva", dataType: "integer" },
  { index: 118, key: "v112_fecha_reconstructiva", dataType: "date" },
  { index: 119, key: "v113_paliativo", dataType: "integer" },
  { index: 120, key: "v114_fecha_inicio_paliativo", dataType: "date" },
  { index: 121, key: "v115_ips_paliativo", dataType: "text" },
  { index: 122, key: "v116_nutricion", dataType: "integer" },
  { index: 123, key: "v117_fecha_nutricion", dataType: "date" },
  { index: 124, key: "v118_psicologia", dataType: "integer" },
  { index: 125, key: "v119_fecha_psicologia", dataType: "date" },
  { index: 126, key: "v120_rehabilitacion", dataType: "integer" },
  { index: 127, key: "v121_fecha_rehabilitacion", dataType: "date" },
  { index: 128, key: "v122_cuidado_paliativo_domiciliario", dataType: "integer" },
  { index: 129, key: "v123_navegacion", dataType: "integer" },
  { index: 130, key: "v124_dolor", dataType: "integer" },

  // --- V125-V134: Situación actual ---
  { index: 131, key: "v125_ultimo_contacto", dataType: "date" },
  { index: 132, key: "v126_estado_vital", dataType: "integer" },
  { index: 133, key: "v127_ecog", dataType: "integer" },
  { index: 134, key: "v128_novedad_admin", dataType: "integer" },
  { index: 135, key: "v129_novedad_clinica", dataType: "integer" },
  { index: 136, key: "v130_fecha_novedad", dataType: "date" },
  { index: 137, key: "v131_fecha_muerte", dataType: "date" },
  { index: 138, key: "v132_causa_muerte", dataType: "integer" },
  { index: 139, key: "v133_codigo_muerte", dataType: "text" },
  { index: 140, key: "v134_fecha_corte", dataType: "date" },
];

/** Total de campos esperados en cada línea del archivo */
export const EXPECTED_FIELD_COUNT = 168;

/**
 * Convierte los campos string del archivo a los tipos de CACRecord.
 * Los campos de tipo integer/numeric se convierten a number.
 */
export function mapFieldsToRecord(
  fields: string[],
): Partial<CACRecord> {
  const record: Record<string, unknown> = {};

  for (const def of FIELD_MAPPING) {
    const raw = fields[def.index]?.trim() ?? "";
    switch (def.dataType) {
      case "integer":
        record[def.key] = raw === "" ? 0 : parseInt(raw, 10);
        break;
      case "numeric":
        record[def.key] = raw === "" ? 0 : parseFloat(raw);
        break;
      default:
        record[def.key] = raw;
    }
  }

  return record as Partial<CACRecord>;
}
