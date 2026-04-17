/**
 * Tests unitarios para el motor de validación y reglas cruzadas.
 */

import { describe, it, expect } from "vitest";
import type { CACRecord } from "@/types/cac";
import { COMODINES_FECHA } from "@/types/cac";
import {
  validateRecord,
  createEmptyCatalogs,
} from "../engine";
import type { ValidationContext } from "../types";

/** Crea un registro CACRecord con valores por defecto */
function makeRecord(overrides: Partial<CACRecord> = {}): CACRecord {
  const base: CACRecord = {
    v01_primer_nombre: "JUAN",
    v02_segundo_nombre: "",
    v03_primer_apellido: "PEREZ",
    v04_segundo_apellido: "GOMEZ",
    v05_tipo_id: "CC",
    v06_numero_id: "1234567890",
    v07_fecha_nacimiento: "1970-05-15",
    v08_sexo: "M",
    v09_ocupacion: "9999",
    v10_regimen: "C",
    v11_codigo_eapb: "EPS001",
    v12_pertenencia_etnica: 1,
    v13_grupo_poblacional: 1,
    v14_municipio_residencia: "05001",
    v15_telefono: "3001234567",
    v16_fecha_afiliacion: "2020-01-01",
    v17_cie10: "C50.9",
    v18_fecha_diagnostico: "2022-06-15",
    v19_medio_diagnostico: 1,
    v20_topografia: "C50",
    v21_base_diagnostico: 5,
    v22_grado_diferenciacion: 2,
    v23_lateralidad: 1,
    v24_fecha_biopsia: "2022-06-15",
    v25_ips_diagnostico: "IPS001",
    v26_municipio_ips_diagnostico: "05001",
    v27_histologia: 1,
    v28_comportamiento: 3,
    v29_estadificacion: 10,
    v30_clasificacion_tnm: "T2N0M0",
    v31_her2_realizado: 1,
    v32_her2_fecha: "2022-07-01",
    v33_her2_resultado: 2,
    v34_receptores_estrogeno: 1,
    v35_receptores_progesterona: 1,
    v36_ki67: 20,
    v37_gleason: 98,
    v38_psa: 98,
    v39_psa_fecha: COMODINES_FECHA.NO_APLICA,
    v40_estadio_ann_arbor: 98,
    v41_sintomas_b: 98,
    v42_ipss: 98,
    v43_compromiso_extranodal: 98,
    v44_ldh: 98,
    v45_recibio_qs: 1,
    v46_fecha_inicio_qs: "2022-08-01",
    v47_num_ciclos: 8,
    v48_intencion_primer_esquema: 1,
    v49_ips_primer_esquema: "IPS001",
    v50_municipio_ips_qs: "05001",
    v51_fecha_inicio_ultimo_esquema: "2022-08-01",
    v52_intencion_ultimo_esquema: 1,
    v53_1_med_atc_primer: "L01DB01",
    v53_2_med_atc_primer: "L01AA09",
    v53_3_med_atc_primer: "L01CD01",
    v53_4_med_atc_primer: "98",
    v53_5_med_atc_primer: "98",
    v53_6_med_atc_primer: "98",
    v53_7_med_atc_primer: "98",
    v53_8_med_atc_primer: "98",
    v54_med_atc_ultimo_1: "98",
    v55_med_atc_ultimo_2: "98",
    v56_med_atc_ultimo_3: "98",
    v57_num_ciclos_ultimo: 98,
    v58_fecha_ultimo_ciclo: COMODINES_FECHA.NO_APLICA,
    v59_estado_esquema: 1,
    v60_recibio_hormonoterapia: 2,
    v61_fecha_inicio_hormono: COMODINES_FECHA.NO_APLICA,
    v62_tipo_hormono: 98,
    v63_med_hormono_1: "98",
    v64_med_hormono_2: "98",
    v65_med_hormono_3: "98",
    v66_fecha_ultimo_hormono: COMODINES_FECHA.NO_APLICA,
    v67_estado_hormono: 98,
    v68_recibio_inmunoterapia: 2,
    v69_fecha_inicio_inmuno: COMODINES_FECHA.NO_APLICA,
    v70_med_inmuno_1: "98",
    v71_med_inmuno_2: "98",
    v72_fecha_ultimo_inmuno: COMODINES_FECHA.NO_APLICA,
    v73_estado_inmuno: 98,
    v74_recibio_cirugia: 1,
    v75_fecha_cirugia: "2022-10-15",
    v76_cups_cirugia: "172410",
    v77_ips_cirugia: "IPS001",
    v78_municipio_ips_cirugia: "05001",
    v79_intencion_cirugia: 1,
    v80_fecha_ultima_cirugia: "2022-10-15",
    v81_cups_ultima_cirugia: "172410",
    v82_estado_post_cirugia: 1,
    v83_margen_quirurgico: 1,
    v84_ganglios_evaluados: 10,
    v85_ganglios_positivos: 2,
    v86_recibio_radioterapia: 2,
    v87_fecha_inicio_rt: COMODINES_FECHA.NO_APLICA,
    v88_tipo_rt: 98,
    v89_dosis_total_rt: 98,
    v90_num_sesiones_rt: 98,
    v91_ips_rt: "98",
    v92_municipio_ips_rt: "98",
    v93_intencion_rt: 98,
    v94_fecha_inicio_ultimo_rt: COMODINES_FECHA.NO_APLICA,
    v95_tipo_ultimo_rt: 98,
    v96_dosis_ultimo_rt: 98,
    v97_num_sesiones_ultimo_rt: 98,
    v98_fecha_ultimo_rt: COMODINES_FECHA.NO_APLICA,
    v99_estado_rt: 98,
    v100_recibio_braquiterapia: 2,
    v101_fecha_braquiterapia: COMODINES_FECHA.NO_APLICA,
    v102_tipo_braquiterapia: 98,
    v103_dosis_braquiterapia: 98,
    v104_sesiones_braquiterapia: 98,
    v105_estado_braquiterapia: 98,
    v106_recibio_trasplante: 2,
    v107_fecha_trasplante: COMODINES_FECHA.NO_APLICA,
    v108_tipo_trasplante: 98,
    v109_ips_trasplante: "98",
    v110_estado_trasplante: 98,
    v111_reconstructiva: 2,
    v112_fecha_reconstructiva: COMODINES_FECHA.NO_APLICA,
    v113_paliativo: 2,
    v114_fecha_inicio_paliativo: COMODINES_FECHA.NO_APLICA,
    v115_ips_paliativo: "98",
    v116_nutricion: 1,
    v117_fecha_nutricion: "2022-09-01",
    v118_psicologia: 1,
    v119_fecha_psicologia: "2022-09-01",
    v120_rehabilitacion: 2,
    v121_fecha_rehabilitacion: COMODINES_FECHA.NO_APLICA,
    v122_cuidado_paliativo_domiciliario: 2,
    v123_navegacion: 1,
    v124_dolor: 1,
    v125_ultimo_contacto: "2022-12-15",
    v126_estado_vital: 1,
    v127_ecog: 1,
    v128_novedad_admin: 1,
    v129_novedad_clinica: 1,
    v130_fecha_novedad: "2022-12-20",
    v131_fecha_muerte: COMODINES_FECHA.NO_APLICA,
    v132_causa_muerte: 98,
    v133_codigo_muerte: "98",
    v134_fecha_corte: "2023-01-01",
  };
  return { ...base, ...overrides };
}

const ctx: ValidationContext = {
  catalogos: createEmptyCatalogs(),
};

// ============================================================
// Validation Engine — basic tests
// ============================================================
describe("validateRecord — registro válido", () => {
  it("registro completo y válido produce 0 errores", () => {
    const record = makeRecord();
    const errors = validateRecord(record, 1, ctx);
    expect(errors).toHaveLength(0);
  });
});

// ============================================================
// Cross-validation rules
// ============================================================
describe("Cross-validation: V17↔V29 in situ", () => {
  it("CIE-10 D (in situ) con estadio 0 es válido", () => {
    const record = makeRecord({ v17_cie10: "D05", v29_estadificacion: 0 });
    const errors = validateRecord(record, 1, ctx);
    const insituErrors = errors.filter(
      (e) => e.ruleName === "cie10_insitu_estadio_coherente",
    );
    expect(insituErrors).toHaveLength(0);
  });

  it("CIE-10 D (in situ) con estadio ≠ 0 genera error", () => {
    const record = makeRecord({ v17_cie10: "D05", v29_estadificacion: 5 });
    const errors = validateRecord(record, 1, ctx);
    const insituErrors = errors.filter(
      (e) => e.ruleName === "cie10_insitu_estadio_coherente",
    );
    expect(insituErrors.length).toBeGreaterThan(0);
    expect(insituErrors[0].message).toContain("in situ");
  });
});

describe("Cross-validation: V128=4 fallecido", () => {
  it("fallecido con fecha muerte real es válido", () => {
    const record = makeRecord({
      v128_novedad_admin: 4,
      v126_estado_vital: 2,
      v131_fecha_muerte: "2022-11-15",
      v132_causa_muerte: 1,
    });
    const errors = validateRecord(record, 1, ctx);
    const fallecidoErrors = errors.filter(
      (e) => e.ruleName.startsWith("fallecido_"),
    );
    expect(fallecidoErrors).toHaveLength(0);
  });

  it("fallecido sin fecha muerte genera error", () => {
    const record = makeRecord({
      v128_novedad_admin: 4,
      v126_estado_vital: 2,
      v131_fecha_muerte: COMODINES_FECHA.DESCONOCIDO,
      v132_causa_muerte: 1,
    });
    const errors = validateRecord(record, 1, ctx);
    const fechaError = errors.find(
      (e) => e.ruleName === "fallecido_requiere_fecha_muerte",
    );
    expect(fechaError).toBeDefined();
  });

  it("fallecido con causa muerte = 98 genera error", () => {
    const record = makeRecord({
      v128_novedad_admin: 4,
      v126_estado_vital: 2,
      v131_fecha_muerte: "2022-11-15",
      v132_causa_muerte: 98,
    });
    const errors = validateRecord(record, 1, ctx);
    const causaError = errors.find(
      (e) => e.ruleName === "fallecido_requiere_causa_muerte",
    );
    expect(causaError).toBeDefined();
  });
});

describe("Cross-validation: V128=2 caso nuevo", () => {
  it("caso nuevo con fecha diagnóstico real es válido", () => {
    const record = makeRecord({ v128_novedad_admin: 2 });
    const errors = validateRecord(record, 1, ctx);
    const casoNuevoErrors = errors.filter(
      (e) => e.ruleName === "caso_nuevo_requiere_fecha_diagnostico",
    );
    expect(casoNuevoErrors).toHaveLength(0);
  });

  it("caso nuevo con fecha 1800-01-01 genera error", () => {
    const record = makeRecord({
      v128_novedad_admin: 2,
      v18_fecha_diagnostico: COMODINES_FECHA.DESCONOCIDO,
    });
    const errors = validateRecord(record, 1, ctx);
    const err = errors.find(
      (e) => e.ruleName === "caso_nuevo_requiere_fecha_diagnostico",
    );
    expect(err).toBeDefined();
  });
});

describe("Cross-validation: HER2 solo mama", () => {
  it("HER2 realizado para C50 es válido", () => {
    const record = makeRecord({ v17_cie10: "C50.9", v31_her2_realizado: 1 });
    const errors = validateRecord(record, 1, ctx);
    const herErrors = errors.filter((e) => e.ruleName === "her2_solo_mama");
    expect(herErrors).toHaveLength(0);
  });

  it("HER2 realizado para no-mama genera warning", () => {
    const record = makeRecord({ v17_cie10: "C34.9", v31_her2_realizado: 1 });
    const errors = validateRecord(record, 1, ctx);
    const herErrors = errors.filter((e) => e.ruleName === "her2_solo_mama");
    expect(herErrors.length).toBeGreaterThan(0);
  });
});

describe("Cross-validation: Gleason solo próstata", () => {
  it("Gleason para C61 es válido", () => {
    const record = makeRecord({
      v17_cie10: "C61",
      v37_gleason: 7,
      v08_sexo: "M",
    });
    const errors = validateRecord(record, 1, ctx);
    const gleasonErrors = errors.filter(
      (e) => e.ruleName === "gleason_solo_prostata",
    );
    expect(gleasonErrors).toHaveLength(0);
  });

  it("Gleason para no-próstata genera warning", () => {
    const record = makeRecord({ v17_cie10: "C50.9", v37_gleason: 7 });
    const errors = validateRecord(record, 1, ctx);
    const gleasonErrors = errors.filter(
      (e) => e.ruleName === "gleason_solo_prostata",
    );
    expect(gleasonErrors.length).toBeGreaterThan(0);
  });
});

describe("Cross-validation: V85 ≤ V84 ganglios", () => {
  it("ganglios positivos ≤ evaluados es válido", () => {
    const record = makeRecord({
      v84_ganglios_evaluados: 10,
      v85_ganglios_positivos: 2,
    });
    const errors = validateRecord(record, 1, ctx);
    const gangErrors = errors.filter(
      (e) => e.ruleName === "ganglios_positivos_coherencia",
    );
    expect(gangErrors).toHaveLength(0);
  });

  it("ganglios positivos > evaluados genera error", () => {
    const record = makeRecord({
      v84_ganglios_evaluados: 3,
      v85_ganglios_positivos: 5,
    });
    const errors = validateRecord(record, 1, ctx);
    const gangErrors = errors.filter(
      (e) => e.ruleName === "ganglios_positivos_coherencia",
    );
    expect(gangErrors.length).toBeGreaterThan(0);
  });
});

describe("Cross-validation: sexo ↔ diagnóstico", () => {
  it("próstata en hombre es válido", () => {
    const record = makeRecord({
      v17_cie10: "C61",
      v08_sexo: "M",
      v37_gleason: 7,
    });
    const errors = validateRecord(record, 1, ctx);
    const sexErrors = errors.filter(
      (e) => e.ruleName === "sexo_diagnostico_coherente",
    );
    expect(sexErrors).toHaveLength(0);
  });

  it("próstata en mujer genera error", () => {
    const record = makeRecord({ v17_cie10: "C61", v08_sexo: "F" });
    const errors = validateRecord(record, 1, ctx);
    const sexErrors = errors.filter(
      (e) => e.ruleName === "sexo_diagnostico_coherente",
    );
    expect(sexErrors.length).toBeGreaterThan(0);
  });
});

describe("Regla V53: ATC no repetidos", () => {
  it("medicamentos diferentes es válido", () => {
    const record = makeRecord({
      v53_1_med_atc_primer: "L01DB01",
      v53_2_med_atc_primer: "L01AA09",
      v53_3_med_atc_primer: "L01CD01",
    });
    const errors = validateRecord(record, 1, ctx);
    const atcErrors = errors.filter(
      (e) => e.ruleName === "atc_primer_esquema_no_repetidos",
    );
    expect(atcErrors).toHaveLength(0);
  });

  it("medicamentos repetidos genera error", () => {
    const record = makeRecord({
      v53_1_med_atc_primer: "L01DB01",
      v53_2_med_atc_primer: "L01DB01",
      v53_3_med_atc_primer: "L01CD01",
    });
    const errors = validateRecord(record, 1, ctx);
    const atcErrors = errors.filter(
      (e) => e.ruleName === "atc_primer_esquema_no_repetidos",
    );
    expect(atcErrors.length).toBeGreaterThan(0);
  });
});
