// src/initialState.ts
import type { CACReport } from './types';

const esqVacio = {
  ubicacion_temporal: '',
  fecha_inicio: '',
  fecha_fin: '1800-01-01',
  num_ips: '1',
  ips1: '',
  ips2: '98',
  num_medicamentos: '',
  medicamentos: [''],
  qt_intratecal: '2',
  caracteristicas: '3',
  motivo_finalizacion: '98',
};

export const initialReport: CACReport = {
  cabecera: { id_reporte: '', fecha_corte: '', fuente: 'EAPB' },
  paciente: {
    primer_nombre: '', segundo_nombre: 'NONE', primer_apellido: '',
    segundo_apellido: 'NOAP', tipo_id: 'CC', numero_id: '',
    fecha_nacimiento: '', sexo: '', ocupacion: '9999',
    regimen_afiliacion: 'C', codigo_eps: '', pertenencia_etnica: '6',
    grupo_poblacional: '35', municipio_residencia: '', telefono: '0',
    fecha_afiliacion: '',
  },
  diagnostico: {
    cie10_neoplasia_primaria: '', fecha_diagnostico: '', fecha_remision: '',
    fecha_ingreso_ips: '', tipo_estudio_diagnostico: '',
    motivo_sin_histopatologia: '98', fecha_recoleccion_muestra: '',
    fecha_informe_histopatologico: '', codigo_ips_confirmadora: '',
    fecha_primera_consulta_tratante: '', histologia: '',
    grado_diferenciacion: '', estadificacion_tnm: '', fecha_estadificacion_tnm: '1845-01-01',
    her2_realizado: '98', fecha_her2: '1845-01-01', resultado_her2: '98',
    estadificacion_dukes: '98',
    fecha_dukes: '1845-01-01', ann_arbor_lugano: '98', gleason: '98',
    clasificacion_riesgo: '98',
    fecha_clasificacion_riesgo: '1845-01-01', objetivo_inicial: '', objetivo_periodo: '',
    antecedente_otro_cancer: '', fecha_otro_cancer: '1845-01-01',
    cie10_otro_cancer: '',
  },
  terapia_sistemica: {
    recibio_qt: '98', num_fases: '98', num_ciclos: '98',
    primer_esquema: null, ultimo_esquema: null,
  },
  cirugia: {
    recibio_cirugia: '2', num_cirugias: '98', fecha_primera: '1845-01-01',
    ips_primera: '98', cups_primera: '98', ubicacion_primera: '98',
    fecha_ultima: '1845-01-01', ips_ultima: '98', cups_ultima: '98',
    estado_vital_post_cirugia: '98',
  },
  radioterapia: { recibio_rt: '98', num_sesiones: '98', primer_esquema: null },
  trasplante: {
    recibio_trasplante: '98', tipo_trasplante: '98',
    fecha_trasplante: '1845-01-01', ips_trasplante: '98',
  },
  cirugia_reconstructiva: {
    recibio_cx_rec: '98', fecha_cx_rec: '1845-01-01', ips_cx_rec: '98',
  },
  cuidados_paliativos: {
    valorado: '2', fecha_primera_atencion: '1845-01-01', ips_paliativo: '98',
  },
  soporte: {
    psiquiatria: '98', nutricion: '98', fecha_nutricion: '1845-01-01',
    soporte_nutricional: '4', terapias_complementarias: '98',
  },
  resultado: {
    tipo_tratamiento_corte: '', resultado_oncologico: '', estado_vital: '',
    novedad_administrativa: '0', novedad_clinica: '', fecha_desafiliacion: '1845-01-01',
    fecha_muerte: '1845-01-01', causa_muerte: '98', codigo_bdua: '',
    fecha_bdua: '',
  },
};
