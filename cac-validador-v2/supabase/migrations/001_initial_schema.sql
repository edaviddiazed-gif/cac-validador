-- ============================================================
-- CAC Validador v2.0 — Migración Inicial
-- Resolución 0247/2014 · 134 variables · 168 campos
-- ============================================================

-- ========================
-- 1. Extensiones
-- ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================
-- 2. Tablas de referencia
-- ========================

CREATE TABLE IF NOT EXISTS cie10_cac (
  codigo VARCHAR(10) PRIMARY KEY,
  descripcion TEXT NOT NULL,
  agrupador TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS atc_medicamentos (
  codigo VARCHAR(15) PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cups_procedimientos (
  codigo VARCHAR(10) PRIMARY KEY,
  descripcion TEXT NOT NULL,
  tipo TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS divipola_municipios (
  codigo VARCHAR(5) PRIMARY KEY,
  nombre TEXT NOT NULL,
  departamento TEXT NOT NULL,
  codigo_departamento VARCHAR(2)
);

-- ========================
-- 3. Tabla principal: EAPB
-- ========================

CREATE TABLE IF NOT EXISTS eapb (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  regimen VARCHAR(2) CHECK (regimen IN ('C', 'S', 'P', 'E', 'N')),
  nit VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 4. Perfiles de usuario
-- ========================

CREATE TYPE user_role AS ENUM (
  'admin_cac',
  'admin_eapb',
  'operador_eapb',
  'auditor',
  'viewer'
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  eapb_id UUID REFERENCES eapb(id),
  role user_role NOT NULL DEFAULT 'viewer',
  nombre_completo TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 5. Reportes de cáncer
-- ========================

CREATE TYPE reporte_estado AS ENUM (
  'pendiente',
  'validando',
  'validado',
  'error',
  'exportado'
);

CREATE TABLE IF NOT EXISTS reportes_cancer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eapb_id UUID NOT NULL REFERENCES eapb(id),
  periodo_corte DATE NOT NULL,
  nombre_archivo TEXT NOT NULL,
  estado reporte_estado DEFAULT 'pendiente',
  total_registros INTEGER DEFAULT 0,
  registros_validos INTEGER DEFAULT 0,
  registros_con_error INTEGER DEFAULT 0,
  archivo_storage_path TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  usuario_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ========================
-- 6. Registros individuales (134 variables)
-- ========================

CREATE TABLE IF NOT EXISTS registros_cancer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id UUID NOT NULL REFERENCES reportes_cancer(id) ON DELETE CASCADE,
  linea_numero INTEGER NOT NULL,

  -- Variables 1-16: Identificación EAPB y usuario
  v01_primer_nombre TEXT,
  v02_segundo_nombre TEXT,
  v03_primer_apellido TEXT,
  v04_segundo_apellido TEXT,
  v05_tipo_id VARCHAR(2),
  v06_numero_id TEXT,
  v07_fecha_nacimiento DATE,
  v08_sexo CHAR(1),
  v09_ocupacion VARCHAR(10),
  v10_regimen CHAR(1),
  v11_codigo_eapb VARCHAR(10),
  v12_pertenencia_etnica INTEGER,
  v13_grupo_poblacional INTEGER,
  v14_municipio_residencia VARCHAR(5),
  v15_telefono TEXT,
  v16_fecha_afiliacion DATE,

  -- Variables 17-44: Diagnóstico, estadificación, antecedentes
  v17_cie10 VARCHAR(5),
  v18_fecha_diagnostico DATE,
  v19_medio_diagnostico INTEGER,
  v20_topografia VARCHAR(10),
  v21_base_diagnostico INTEGER,
  v22_grado_diferenciacion INTEGER,
  v23_lateralidad INTEGER,
  v24_fecha_biopsia DATE,
  v25_ips_diagnostico VARCHAR(20),
  v26_municipio_ips_diagnostico VARCHAR(5),
  v27_histologia INTEGER,
  v28_comportamiento INTEGER,
  v29_estadificacion INTEGER,
  v30_clasificacion_tnm TEXT,
  v31_her2_realizado INTEGER,
  v32_her2_fecha DATE,
  v33_her2_resultado INTEGER,
  v34_receptores_estrogeno INTEGER,
  v35_receptores_progesterona INTEGER,
  v36_ki67 INTEGER,
  v37_gleason INTEGER,
  v38_psa NUMERIC(10,2),
  v39_psa_fecha DATE,
  v40_estadio_ann_arbor INTEGER,
  v41_sintomas_b INTEGER,
  v42_ipss INTEGER,
  v43_compromiso_extranodal INTEGER,
  v44_ldh INTEGER,

  -- Variables 45-73: Terapia sistémica (primer y último esquema)
  v45_recibio_qs INTEGER,
  v46_fecha_inicio_qs DATE,
  v47_num_ciclos INTEGER,
  v48_intencion_primer_esquema INTEGER,
  v49_ips_primer_esquema VARCHAR(20),
  v50_municipio_ips_qs VARCHAR(5),
  v51_fecha_inicio_ultimo_esquema DATE,
  v52_intencion_ultimo_esquema INTEGER,
  -- V53 tiene sub-variables: 53.1 a 53.8 (medicamentos ATC primer esquema)
  v53_1_med_atc_primer TEXT,
  v53_2_med_atc_primer TEXT,
  v53_3_med_atc_primer TEXT,
  v53_4_med_atc_primer TEXT,
  v53_5_med_atc_primer TEXT,
  v53_6_med_atc_primer TEXT,
  v53_7_med_atc_primer TEXT,
  v53_8_med_atc_primer TEXT,
  v54_med_atc_ultimo_1 TEXT,
  v55_med_atc_ultimo_2 TEXT,
  v56_med_atc_ultimo_3 TEXT,
  v57_num_ciclos_ultimo INTEGER,
  v58_fecha_ultimo_ciclo DATE,
  v59_estado_esquema INTEGER,
  v60_recibio_hormonoterapia INTEGER,
  v61_fecha_inicio_hormono DATE,
  v62_tipo_hormono INTEGER,
  v63_med_hormono_1 TEXT,
  v64_med_hormono_2 TEXT,
  v65_med_hormono_3 TEXT,
  v66_fecha_ultimo_hormono DATE,
  v67_estado_hormono INTEGER,
  v68_recibio_inmunoterapia INTEGER,
  v69_fecha_inicio_inmuno DATE,
  v70_med_inmuno_1 TEXT,
  v71_med_inmuno_2 TEXT,
  v72_fecha_ultimo_inmuno DATE,
  v73_estado_inmuno INTEGER,

  -- Variables 74-85: Cirugía
  v74_recibio_cirugia INTEGER,
  v75_fecha_cirugia DATE,
  v76_cups_cirugia VARCHAR(10),
  v77_ips_cirugia VARCHAR(20),
  v78_municipio_ips_cirugia VARCHAR(5),
  v79_intencion_cirugia INTEGER,
  v80_fecha_ultima_cirugia DATE,
  v81_cups_ultima_cirugia VARCHAR(10),
  v82_estado_post_cirugia INTEGER,
  v83_margen_quirurgico INTEGER,
  v84_ganglios_evaluados INTEGER,
  v85_ganglios_positivos INTEGER,

  -- Variables 86-105: Radioterapia (primer y último esquema)
  v86_recibio_radioterapia INTEGER,
  v87_fecha_inicio_rt DATE,
  v88_tipo_rt INTEGER,
  v89_dosis_total_rt NUMERIC(10,2),
  v90_num_sesiones_rt INTEGER,
  v91_ips_rt VARCHAR(20),
  v92_municipio_ips_rt VARCHAR(5),
  v93_intencion_rt INTEGER,
  v94_fecha_inicio_ultimo_rt DATE,
  v95_tipo_ultimo_rt INTEGER,
  v96_dosis_ultimo_rt NUMERIC(10,2),
  v97_num_sesiones_ultimo_rt INTEGER,
  v98_fecha_ultimo_rt DATE,
  v99_estado_rt INTEGER,
  v100_recibio_braquiterapia INTEGER,
  v101_fecha_braquiterapia DATE,
  v102_tipo_braquiterapia INTEGER,
  v103_dosis_braquiterapia NUMERIC(10,2),
  v104_sesiones_braquiterapia INTEGER,
  v105_estado_braquiterapia INTEGER,

  -- Variables 106-110: Trasplante progenitoras hematopoyéticas
  v106_recibio_trasplante INTEGER,
  v107_fecha_trasplante DATE,
  v108_tipo_trasplante INTEGER,
  v109_ips_trasplante VARCHAR(20),
  v110_estado_trasplante INTEGER,

  -- Variables 111-124: Tratamiento complementario
  v111_reconstructiva INTEGER,
  v112_fecha_reconstructiva DATE,
  v113_paliativo INTEGER,
  v114_fecha_inicio_paliativo DATE,
  v115_ips_paliativo VARCHAR(20),
  v116_nutricion INTEGER,
  v117_fecha_nutricion DATE,
  v118_psicologia INTEGER,
  v119_fecha_psicologia DATE,
  v120_rehabilitacion INTEGER,
  v121_fecha_rehabilitacion DATE,
  v122_cuidado_paliativo_domiciliario INTEGER,
  v123_navegacion INTEGER,
  v124_dolor INTEGER,

  -- Variables 125-134: Situación actual, novedades, estado vital
  v125_ultimo_contacto DATE,
  v126_estado_vital INTEGER,
  v127_ecog INTEGER,
  v128_novedad_admin INTEGER,
  v129_novedad_clinica INTEGER,
  v130_fecha_novedad DATE,
  v131_fecha_muerte DATE,
  v132_causa_muerte INTEGER,
  v133_codigo_muerte VARCHAR(5),
  v134_fecha_corte DATE,

  -- Datos originales y metadata
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 7. Errores de validación
-- ========================

CREATE TYPE tipo_error AS ENUM (
  'formato',
  'rango',
  'requerido',
  'cruce',
  'comodin',
  'novedad',
  'negocio',
  'codificacion'
);

CREATE TABLE IF NOT EXISTS errores_validacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID NOT NULL REFERENCES registros_cancer(id) ON DELETE CASCADE,
  variable_numero INTEGER NOT NULL,
  variable_nombre TEXT NOT NULL,
  tipo_error tipo_error NOT NULL,
  severidad VARCHAR(10) DEFAULT 'error' CHECK (severidad IN ('error', 'warning', 'info')),
  valor_reportado TEXT,
  mensaje_error TEXT NOT NULL,
  sugerencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 8. Mensajes de validación
-- ========================

CREATE TABLE IF NOT EXISTS validacion_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL,  -- COMODIN, VALIDACION, CRUCE, NEGOCIO, etc
  codigo VARCHAR(100) UNIQUE NOT NULL,  -- COMODIN_DESCONOCIDO, etc
  mensaje_es TEXT NOT NULL,
  mensaje_en TEXT,
  severidad VARCHAR(10) DEFAULT 'error' CHECK (severidad IN ('error', 'warning', 'info')),
  variable_aplica INTEGER,  -- numero de variable si aplica a variable específica
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 9. Auditoría
-- ========================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  eapb_id UUID REFERENCES eapb(id),
  accion TEXT NOT NULL,
  tabla TEXT NOT NULL,
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 9. Planes de suscripción
-- ========================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(50) UNIQUE NOT NULL,
  precio_mensual_cop INTEGER DEFAULT 0,
  limites JSONB NOT NULL DEFAULT '{
    "reportes_mes": 1,
    "registros_max": 500,
    "features": ["validacion_basica", "export_excel"]
  }'::jsonb,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eapb_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eapb_id UUID NOT NULL REFERENCES eapb(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'cancelado')),
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 10. Índices para performance
-- ========================

-- Búsqueda por número de identificación del paciente
CREATE INDEX idx_registros_numero_id ON registros_cancer(v06_numero_id);

-- Búsqueda por CIE-10
CREATE INDEX idx_registros_cie10 ON registros_cancer(v17_cie10);

-- Filtrado por reporte (FK)
CREATE INDEX idx_registros_reporte_id ON registros_cancer(reporte_id);

-- Errores por registro
CREATE INDEX idx_errores_registro_id ON errores_validacion(registro_id);

-- Errores por variable (para agregaciones)
CREATE INDEX idx_errores_variable ON errores_validacion(variable_numero);

-- Reportes por EAPB + periodo
CREATE INDEX idx_reportes_eapb_periodo ON reportes_cancer(eapb_id, periodo_corte);

-- Auditoría por usuario y tabla
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_tabla ON audit_log(tabla, created_at DESC);

-- User profiles por eapb
CREATE INDEX idx_profiles_eapb ON user_profiles(eapb_id);

-- ========================
-- 11. Row Level Security
-- ========================

ALTER TABLE reportes_cancer ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_cancer ENABLE ROW LEVEL SECURITY;
ALTER TABLE errores_validacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: obtener eapb_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_eapb_id()
RETURNS UUID AS $$
  SELECT eapb_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: verificar rol
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = required_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: es admin CAC (acceso total)
CREATE OR REPLACE FUNCTION is_admin_cac()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin_cac'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- Policies: reportes_cancer ----

CREATE POLICY "admin_cac_full_access_reportes"
  ON reportes_cancer FOR ALL
  USING (is_admin_cac());

CREATE POLICY "eapb_select_own_reportes"
  ON reportes_cancer FOR SELECT
  USING (eapb_id = get_user_eapb_id());

CREATE POLICY "eapb_insert_own_reportes"
  ON reportes_cancer FOR INSERT
  WITH CHECK (eapb_id = get_user_eapb_id());

CREATE POLICY "eapb_admin_update_own_reportes"
  ON reportes_cancer FOR UPDATE
  USING (eapb_id = get_user_eapb_id() AND has_role('admin_eapb'));

-- ---- Policies: registros_cancer ----

CREATE POLICY "admin_cac_full_access_registros"
  ON registros_cancer FOR ALL
  USING (is_admin_cac());

CREATE POLICY "eapb_select_own_registros"
  ON registros_cancer FOR SELECT
  USING (
    reporte_id IN (
      SELECT id FROM reportes_cancer WHERE eapb_id = get_user_eapb_id()
    )
  );

CREATE POLICY "eapb_insert_own_registros"
  ON registros_cancer FOR INSERT
  WITH CHECK (
    reporte_id IN (
      SELECT id FROM reportes_cancer WHERE eapb_id = get_user_eapb_id()
    )
  );

-- ---- Policies: errores_validacion ----

CREATE POLICY "admin_cac_full_access_errores"
  ON errores_validacion FOR ALL
  USING (is_admin_cac());

CREATE POLICY "eapb_select_own_errores"
  ON errores_validacion FOR SELECT
  USING (
    registro_id IN (
      SELECT rc.id FROM registros_cancer rc
      JOIN reportes_cancer rp ON rc.reporte_id = rp.id
      WHERE rp.eapb_id = get_user_eapb_id()
    )
  );

-- ---- Policies: user_profiles ----

CREATE POLICY "users_read_own_profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid() OR is_admin_cac());

CREATE POLICY "admin_manage_profiles"
  ON user_profiles FOR ALL
  USING (is_admin_cac() OR (has_role('admin_eapb') AND eapb_id = get_user_eapb_id()));

-- ---- Policies: audit_log ----

CREATE POLICY "admin_read_audit"
  ON audit_log FOR SELECT
  USING (is_admin_cac() OR eapb_id = get_user_eapb_id());

-- ========================
-- 12. Datos semilla: planes
-- ========================

INSERT INTO subscription_plans (nombre, precio_mensual_cop, limites) VALUES
  ('gratuito', 0, '{"reportes_mes": 1, "registros_max": 500, "features": ["validacion_basica", "export_excel"]}'),
  ('basico', 150000, '{"reportes_mes": 5, "registros_max": 5000, "features": ["validacion_basica", "export_excel", "export_pdf", "soporte_email"]}'),
  ('profesional', 450000, '{"reportes_mes": -1, "registros_max": 50000, "features": ["validacion_basica", "export_excel", "export_pdf", "ia_asistente", "api_access"]}'),
  ('enterprise', 0, '{"reportes_mes": -1, "registros_max": -1, "features": ["validacion_basica", "export_excel", "export_pdf", "ia_asistente", "api_access", "sla_99", "on_premise", "integracion_his"]}')
ON CONFLICT (nombre) DO NOTHING;
