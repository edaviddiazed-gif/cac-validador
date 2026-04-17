-- ============================================================
-- CAC Validador v2.0 — Migración 003: Validation Jobs + Rate Limits
-- Función de validación asincrónica y control de límites de tasa
-- ============================================================

-- ========================
-- 1. Tabla: Validation Jobs (para tracking async)
-- ========================

CREATE TABLE IF NOT EXISTS validation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id UUID NOT NULL REFERENCES reportes_cancer(id) ON DELETE CASCADE,
  eapb_id UUID NOT NULL REFERENCES eapb(id),
  status VARCHAR(50) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'procesando', 'completado', 'error')),
  
  -- Progreso
  total_registros INTEGER DEFAULT 0,
  registros_procesados INTEGER DEFAULT 0,
  registros_validos INTEGER DEFAULT 0,
  registros_con_error INTEGER DEFAULT 0,
  
  -- Detalles del error
  error_mensaje TEXT,
  error_detalles JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Usuario que triggeró la validación
  usuario_id UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_validation_jobs_reporte ON validation_jobs(reporte_id);
CREATE INDEX idx_validation_jobs_eapb ON validation_jobs(eapb_id);
CREATE INDEX idx_validation_jobs_status ON validation_jobs(status);
CREATE INDEX idx_validation_jobs_created ON validation_jobs(created_at DESC);

-- ========================
-- 2. Tabla: Rate Limiting (por EAPB y endpoint)
-- ========================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eapb_id UUID NOT NULL REFERENCES eapb(id),
  endpoint VARCHAR(100) NOT NULL, -- ej: '/api/upload'
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(eapb_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_eapb ON rate_limits(eapb_id, endpoint, window_start);

-- ========================
-- 3. Función: Increment Rate Limit
-- ========================

CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_eapb_id UUID,
  p_endpoint VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_one_hour_ago TIMESTAMPTZ := v_now - INTERVAL '1 hour';
BEGIN
  -- Limpiar registros antiguos
  DELETE FROM rate_limits
  WHERE eapb_id = p_eapb_id 
    AND endpoint = p_endpoint
    AND window_start < v_one_hour_ago;
  
  -- Actualizar o insertar nuevo
  INSERT INTO rate_limits (eapb_id, endpoint, request_count, window_start)
  VALUES (p_eapb_id, p_endpoint, 1, v_now)
  ON CONFLICT (eapb_id, endpoint, window_start) DO UPDATE
  SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- 4. Función: Check Rate Limit
-- ========================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_eapb_id UUID,
  p_endpoint VARCHAR(100),
  p_max_requests INTEGER DEFAULT 10
)
RETURNS TABLE(allowed BOOLEAN, requests_remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_one_hour_ago TIMESTAMPTZ := v_now - INTERVAL '1 hour';
  v_current_count INTEGER;
BEGIN
  -- Limpiar registros antiguos
  DELETE FROM rate_limits
  WHERE eapb_id = p_eapb_id 
    AND endpoint = p_endpoint
    AND window_start < v_one_hour_ago;
  
  -- Obtener contador actual
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM rate_limits
  WHERE eapb_id = p_eapb_id 
    AND endpoint = p_endpoint
    AND window_start >= v_one_hour_ago;
  
  RETURN QUERY SELECT
    (v_current_count < p_max_requests)::BOOLEAN as allowed,
    (p_max_requests - v_current_count)::INTEGER as requests_remaining,
    (v_one_hour_ago + INTERVAL '1 hour') as reset_at;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- 5. Row Level Security (RLS)
-- ========================

ALTER TABLE validation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ---- Policies: validation_jobs ----

-- Admin CAC: acceso total
CREATE POLICY admin_cac_validation_jobs_all ON validation_jobs
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin_cac'
    )
  );

-- Admin EAPB / Operador EAPB: solo sus propios trabajos
CREATE POLICY eapb_own_validation_jobs ON validation_jobs
  USING (eapb_id = auth.uid())
  WITH CHECK (eapb_id = auth.uid());

-- Auditor: solo lectura
CREATE POLICY auditor_readonly_validation_jobs ON validation_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'auditor'
    )
  );

-- ---- Policies: rate_limits ----
-- Administrativo: solo para lectura de auditoría
CREATE POLICY admin_only_rate_limits ON rate_limits
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin_cac', 'admin_eapb')
    )
  );

-- ========================
-- 6. Índices para performance
-- ========================

CREATE INDEX idx_validation_jobs_user ON validation_jobs(usuario_id, created_at DESC);
CREATE INDEX idx_validation_jobs_status_created ON validation_jobs(status, created_at DESC);
