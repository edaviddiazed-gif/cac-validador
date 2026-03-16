// src/types.ts

export interface ErrorDetalle {
  id_regla: string;
  campo?: string;
  nivel: 'ERROR' | 'ADVERTENCIA';
  mensaje: string;
  variable_res?: string;
}

export interface ValidationResponse {
  valido: boolean;
  total_errores: number;
  total_advertencias: number;
  errores_por_campo: Record<string, ErrorDetalle[]>;
  errores_generales: ErrorDetalle[];
  resumen_por_seccion: Record<string, { criticos: number; advertencias: number }>;
}

export interface EsquemaQt {
  ubicacion_temporal: string;
  fecha_inicio: string;
  fecha_fin: string;
  num_ips: string;
  ips1: string;
  ips2: string;
  num_medicamentos: string;
  medicamentos: string[];
  qt_intratecal: string;
  caracteristicas: string;
  motivo_finalizacion: string;
}

export interface CACReport {
  cabecera: {
    id_reporte: string;
    fecha_corte: string;
    fuente: string;
  };
  paciente: {
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    tipo_id: string;
    numero_id: string;
    fecha_nacimiento: string;
    sexo: string;
    ocupacion: string;
    regimen_afiliacion: string;
    codigo_eps: string;
    pertenencia_etnica: string;
    grupo_poblacional: string;
    municipio_residencia: string;
    telefono: string;
    fecha_afiliacion: string;
  };
  diagnostico: {
    cie10_neoplasia_primaria: string;
    fecha_diagnostico: string;
    fecha_remision: string;
    fecha_ingreso_ips: string;
    tipo_estudio_diagnostico: string;
    motivo_sin_histopatologia: string;
    fecha_recoleccion_muestra: string;
    fecha_informe_histopatologico: string;
    codigo_ips_confirmadora: string;
    fecha_primera_consulta_tratante: string;
    histologia: string;
    grado_diferenciacion: string;
    estadificacion_tnm: string;
    fecha_estadificacion_tnm: string;
    her2_realizado: string;
    fecha_her2: string;
    resultado_her2: string;
    estadificacion_dukes: string;
    ann_arbor_lugano: string;
    gleason: string;
    clasificacion_riesgo: string;
    objetivo_inicial: string;
    objetivo_periodo: string;
    antecedente_otro_cancer: string;
    fecha_otro_cancer: string;
    cie10_otro_cancer: string;
  };
  terapia_sistemica: {
    recibio_qt: string;
    num_fases: string;
    num_ciclos: string;
    primer_esquema: EsquemaQt | null;
    ultimo_esquema: EsquemaQt | null;
  };
  cirugia: {
    recibio_cirugia: string;
    num_cirugias: string;
    fecha_primera: string;
    ips_primera: string;
    cups_primera: string;
    ubicacion_primera: string;
    fecha_ultima: string;
    ips_ultima: string;
    cups_ultima: string;
    estado_vital_post_cirugia: string;
  };
  radioterapia: {
    recibio_rt: string;
    num_sesiones: string;
    primer_esquema: {
      fecha_inicio: string;
      ubicacion_temporal: string;
      tipo_rt: string;
      ips1: string;
      fecha_fin: string;
      caracteristicas: string;
    } | null;
  };
  trasplante: {
    recibio_trasplante: string;
    tipo_trasplante: string;
    fecha_trasplante: string;
    ips_trasplante: string;
  };
  cirugia_reconstructiva: {
    recibio_cx_rec: string;
    fecha_cx_rec: string;
    ips_cx_rec: string;
  };
  cuidados_paliativos: {
    valorado: string;
    fecha_primera_atencion: string;
    ips_paliativo: string;
  };
  soporte: {
    psiquiatria: string;
    nutricion: string;
    fecha_nutricion: string;
    soporte_nutricional: string;
    terapias_complementarias: string;
  };
  resultado: {
    tipo_tratamiento_corte: string;
    resultado_oncologico: string;
    estado_vital: string;
    novedad_administrativa: string;
    novedad_clinica: string;
    fecha_desafiliacion: string;
    fecha_muerte: string;
    causa_muerte: string;
    codigo_bdua: string;
    fecha_bdua: string;
  };
}
