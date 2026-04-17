-- ============================================================
-- Migración 002: Triggers de Auditoría Automática
-- ============================================================

-- Función genérica para auditar cambios en tablas
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_eapb_id UUID;
    v_action TEXT;
    v_registro_id UUID;
BEGIN
    -- Intentar obtener el user_id de la petición HTTP usando postgREST (auth.uid())
    current_user_id := auth.uid();
    
    -- Si existe un usuario, intentar obtener su EAPB
    IF current_user_id IS NOT NULL THEN
        SELECT eapb_id INTO current_eapb_id FROM user_profiles WHERE id = current_user_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_registro_id := NEW.id;
        INSERT INTO audit_log (user_id, eapb_id, accion, tabla, registro_id, datos_nuevos)
        VALUES (current_user_id, current_eapb_id, v_action, TG_TABLE_NAME, v_registro_id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_registro_id := NEW.id;
        -- Solo logear si hay cambios (ignorando updated_at)
        IF row_to_json(OLD)::jsonb IS DISTINCT FROM row_to_json(NEW)::jsonb THEN
            INSERT INTO audit_log (user_id, eapb_id, accion, tabla, registro_id, datos_anteriores, datos_nuevos)
            VALUES (current_user_id, current_eapb_id, v_action, TG_TABLE_NAME, v_registro_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_registro_id := OLD.id;
        INSERT INTO audit_log (user_id, eapb_id, accion, tabla, registro_id, datos_anteriores)
        VALUES (current_user_id, current_eapb_id, v_action, TG_TABLE_NAME, v_registro_id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para "registros_cancer"
DROP TRIGGER IF EXISTS trg_audit_registros ON registros_cancer;
CREATE TRIGGER trg_audit_registros
AFTER INSERT OR UPDATE OR DELETE ON registros_cancer
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Trigger para "reportes_cancer"
DROP TRIGGER IF EXISTS trg_audit_reportes ON reportes_cancer;
CREATE TRIGGER trg_audit_reportes
AFTER INSERT OR UPDATE OR DELETE ON reportes_cancer
FOR EACH ROW EXECUTE FUNCTION log_audit_event();
