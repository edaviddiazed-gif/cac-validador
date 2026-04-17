/**
 * CAC Record — Tipos TypeScript para las 134 variables
 * Resolución 0247/2014
 */

/** Tipos de documento de identidad */
export type TipoDocumento =
  | "RC" | "TI" | "CC" | "CE" | "PA"
  | "MS" | "AS" | "CD" | "SC" | "PE";

/** Sexo del paciente */
export type Sexo = "M" | "F" | "I";

/** Régimen de afiliación */
export type Regimen = "C" | "S" | "P" | "E" | "N";

/** Estado del reporte */
export type ReporteEstado =
  | "pendiente"
  | "validando"
  | "validado"
  | "error"
  | "exportado";

/** Roles de usuario */
export type UserRole =
  | "admin_cac"
  | "admin_eapb"
  | "operador_eapb"
  | "auditor"
  | "viewer";

/** Severidad de errores de validación */
export type ErrorSeveridad = "error" | "warning" | "info";

/** Tipo de error de validación */
export type TipoError =
  | "formato"
  | "rango"
  | "requerido"
  | "cruce"
  | "comodin"
  | "novedad"
  | "negocio"
  | "codificacion";

/** Comodines de fecha válidos */
export const COMODINES_FECHA = {
  DESCONOCIDO: "1800-01-01",
  NO_APLICA: "1845-01-01",
  ENTE_TERRITORIAL: "1846-01-01",
} as const;

export type ComodinFecha =
  (typeof COMODINES_FECHA)[keyof typeof COMODINES_FECHA];

/**
 * Registro completo de cáncer — 134 variables
 * Cada campo corresponde a una variable del instructivo CAC
 */
export interface CACRecord {
  // --- V1-V16: Identificación ---
  v01_primer_nombre: string;
  v02_segundo_nombre: string;
  v03_primer_apellido: string;
  v04_segundo_apellido: string;
  v05_tipo_id: TipoDocumento;
  v06_numero_id: string;
  v07_fecha_nacimiento: string;
  v08_sexo: Sexo;
  v09_ocupacion: string;
  v10_regimen: Regimen;
  v11_codigo_eapb: string;
  v12_pertenencia_etnica: number;
  v13_grupo_poblacional: number;
  v14_municipio_residencia: string;
  v15_telefono: string;
  v16_fecha_afiliacion: string;

  // --- V17-V44: Diagnóstico ---
  v17_cie10: string;
  v18_fecha_diagnostico: string;
  v19_medio_diagnostico: number;
  v20_topografia: string;
  v21_base_diagnostico: number;
  v22_grado_diferenciacion: number;
  v23_lateralidad: number;
  v24_fecha_biopsia: string;
  v25_ips_diagnostico: string;
  v26_municipio_ips_diagnostico: string;
  v27_histologia: number;
  v28_comportamiento: number;
  v29_estadificacion: number;
  v30_clasificacion_tnm: string;
  v31_her2_realizado: number;
  v32_her2_fecha: string;
  v33_her2_resultado: number;
  v34_receptores_estrogeno: number;
  v35_receptores_progesterona: number;
  v36_ki67: number;
  v37_gleason: number;
  v38_psa: number;
  v39_psa_fecha: string;
  v40_estadio_ann_arbor: number;
  v41_sintomas_b: number;
  v42_ipss: number;
  v43_compromiso_extranodal: number;
  v44_ldh: number;

  // --- V45-V73: Terapia sistémica ---
  v45_recibio_qs: number;
  v46_fecha_inicio_qs: string;
  v47_num_ciclos: number;
  v48_intencion_primer_esquema: number;
  v49_ips_primer_esquema: string;
  v50_municipio_ips_qs: string;
  v51_fecha_inicio_ultimo_esquema: string;
  v52_intencion_ultimo_esquema: number;
  v53_1_med_atc_primer: string;
  v53_2_med_atc_primer: string;
  v53_3_med_atc_primer: string;
  v53_4_med_atc_primer: string;
  v53_5_med_atc_primer: string;
  v53_6_med_atc_primer: string;
  v53_7_med_atc_primer: string;
  v53_8_med_atc_primer: string;
  v54_med_atc_ultimo_1: string;
  v55_med_atc_ultimo_2: string;
  v56_med_atc_ultimo_3: string;
  v57_num_ciclos_ultimo: number;
  v58_fecha_ultimo_ciclo: string;
  v59_estado_esquema: number;
  v60_recibio_hormonoterapia: number;
  v61_fecha_inicio_hormono: string;
  v62_tipo_hormono: number;
  v63_med_hormono_1: string;
  v64_med_hormono_2: string;
  v65_med_hormono_3: string;
  v66_fecha_ultimo_hormono: string;
  v67_estado_hormono: number;
  v68_recibio_inmunoterapia: number;
  v69_fecha_inicio_inmuno: string;
  v70_med_inmuno_1: string;
  v71_med_inmuno_2: string;
  v72_fecha_ultimo_inmuno: string;
  v73_estado_inmuno: number;

  // --- V74-V85: Cirugía ---
  v74_recibio_cirugia: number;
  v75_fecha_cirugia: string;
  v76_cups_cirugia: string;
  v77_ips_cirugia: string;
  v78_municipio_ips_cirugia: string;
  v79_intencion_cirugia: number;
  v80_fecha_ultima_cirugia: string;
  v81_cups_ultima_cirugia: string;
  v82_estado_post_cirugia: number;
  v83_margen_quirurgico: number;
  v84_ganglios_evaluados: number;
  v85_ganglios_positivos: number;

  // --- V86-V105: Radioterapia ---
  v86_recibio_radioterapia: number;
  v87_fecha_inicio_rt: string;
  v88_tipo_rt: number;
  v89_dosis_total_rt: number;
  v90_num_sesiones_rt: number;
  v91_ips_rt: string;
  v92_municipio_ips_rt: string;
  v93_intencion_rt: number;
  v94_fecha_inicio_ultimo_rt: string;
  v95_tipo_ultimo_rt: number;
  v96_dosis_ultimo_rt: number;
  v97_num_sesiones_ultimo_rt: number;
  v98_fecha_ultimo_rt: string;
  v99_estado_rt: number;
  v100_recibio_braquiterapia: number;
  v101_fecha_braquiterapia: string;
  v102_tipo_braquiterapia: number;
  v103_dosis_braquiterapia: number;
  v104_sesiones_braquiterapia: number;
  v105_estado_braquiterapia: number;

  // --- V106-V110: Trasplante ---
  v106_recibio_trasplante: number;
  v107_fecha_trasplante: string;
  v108_tipo_trasplante: number;
  v109_ips_trasplante: string;
  v110_estado_trasplante: number;

  // --- V111-V124: Tratamiento complementario ---
  v111_reconstructiva: number;
  v112_fecha_reconstructiva: string;
  v113_paliativo: number;
  v114_fecha_inicio_paliativo: string;
  v115_ips_paliativo: string;
  v116_nutricion: number;
  v117_fecha_nutricion: string;
  v118_psicologia: number;
  v119_fecha_psicologia: string;
  v120_rehabilitacion: number;
  v121_fecha_rehabilitacion: string;
  v122_cuidado_paliativo_domiciliario: number;
  v123_navegacion: number;
  v124_dolor: number;

  // --- V125-V134: Situación actual ---
  v125_ultimo_contacto: string;
  v126_estado_vital: number;
  v127_ecog: number;
  v128_novedad_admin: number;
  v129_novedad_clinica: number;
  v130_fecha_novedad: string;
  v131_fecha_muerte: string;
  v132_causa_muerte: number;
  v133_codigo_muerte: string;
  v134_fecha_corte: string;
}

/** Nombres de las 134 variables para UI y reportes */
export const VARIABLE_NAMES: Record<string, string> = {
  v01_primer_nombre: "Primer nombre",
  v02_segundo_nombre: "Segundo nombre",
  v03_primer_apellido: "Primer apellido",
  v04_segundo_apellido: "Segundo apellido",
  v05_tipo_id: "Tipo de documento",
  v06_numero_id: "Número de documento",
  v07_fecha_nacimiento: "Fecha de nacimiento",
  v08_sexo: "Sexo",
  v09_ocupacion: "Ocupación CIUO",
  v10_regimen: "Régimen",
  v11_codigo_eapb: "Código EAPB",
  v12_pertenencia_etnica: "Pertenencia étnica",
  v13_grupo_poblacional: "Grupo poblacional",
  v14_municipio_residencia: "Municipio residencia",
  v15_telefono: "Teléfono",
  v16_fecha_afiliacion: "Fecha afiliación",
  v17_cie10: "Diagnóstico CIE-10",
  v18_fecha_diagnostico: "Fecha diagnóstico",
  v128_novedad_admin: "Novedad administrativa",
  v129_novedad_clinica: "Novedad clínica",
  v131_fecha_muerte: "Fecha de muerte",
  v132_causa_muerte: "Causa de muerte",
  v134_fecha_corte: "Fecha de corte",
};
