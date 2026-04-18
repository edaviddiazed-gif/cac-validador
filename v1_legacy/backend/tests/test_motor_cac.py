# tests/test_motor_cac.py
"""
Tests del motor de validación CAC.
===================================
Cubre los 5 bugs corregidos + casos de regresión.

Ejecutar:
    cd v1_legacy/backend
    pytest tests/test_motor_cac.py -v
"""

import pytest
from app.validators.expansion import expandir_campos_activos, diagnosticar_grupos


# ─── Fixtures de reportes de prueba ────────────────────────────────────────

def reporte_base():
    """Reporte mínimo válido — no recibe ningún tratamiento activo."""
    return {
        "cabecera": {"fecha_corte": "2024-01-01"},
        "paciente": {
            "tipo_id": "CC",
            "fecha_nacimiento": "1980-05-15",
            "sexo": "M",
        },
        "diagnostico": {
            "cie10_neoplasia_primaria": "C61",
            "fecha_diagnostico": "2023-03-01",
        },
        "terapia_sistemica": {
            "recibio_qt": "2",   # No recibió QT
            "num_fases": "0",
            "primer_esquema": {
                "num_medicamentos": "0",
            },
            "ultimo_esquema": {
                "num_medicamentos": "0",
            },
        },
        "cirugia": {"recibio_cirugia": "2"},
        "radioterapia": {"recibio_rt": "2"},
        "trasplante": {"recibio_trasplante": "2"},
        "cirugia_reconstructiva": {"recibio_cx_rec": "2"},
        "cuidados_paliativos": {"valorado": "2"},  # No valorado
        "soporte": {},
        "resultado": {
            "estado_vital": "1",
            "tipo_tratamiento_corte": "1",
            "fecha_bdua": "2024-01-01",
        },
    }


# ─── TEST FIX-02: Expansión estructural — grupos dinámicos ─────────────────

class TestExpansionEstructural:

    def test_sin_qt_no_activa_medicamentos(self):
        """Si recibio_qt != 1, ningún campo de medicamentos debe estar activo."""
        rep = reporte_base()
        activos = expandir_campos_activos(rep)
        for i in range(1, 10):
            assert f"terapia_sistemica.primer_esquema.med{i}" not in activos, (
                f"med{i} no debería estar activo sin QT"
            )
            assert f"terapia_sistemica.ultimo_esquema.med{i}" not in activos

    def test_con_qt_activa_solo_n_medicamentos(self):
        """Con num_medicamentos=3, solo med1, med2, med3 deben estar activos."""
        rep = reporte_base()
        rep["terapia_sistemica"]["recibio_qt"] = "1"
        rep["terapia_sistemica"]["primer_esquema"]["num_medicamentos"] = "3"
        activos = expandir_campos_activos(rep)
        # Activos: med1, med2, med3
        for i in range(1, 4):
            assert f"terapia_sistemica.primer_esquema.med{i}" in activos
        # Inactivos: med4–med9
        for i in range(4, 10):
            assert f"terapia_sistemica.primer_esquema.med{i}" not in activos, (
                f"med{i} NO debería estar activo si num_medicamentos=3"
            )

    def test_con_qt_activa_todos_9_medicamentos(self):
        """Con num_medicamentos=9, todos med1–med9 deben estar activos."""
        rep = reporte_base()
        rep["terapia_sistemica"]["recibio_qt"] = "1"
        rep["terapia_sistemica"]["primer_esquema"]["num_medicamentos"] = "9"
        activos = expandir_campos_activos(rep)
        for i in range(1, 10):
            assert f"terapia_sistemica.primer_esquema.med{i}" in activos

    def test_num_medicamentos_cero_no_activa_nada(self):
        """Con num_medicamentos=0, ningún med debe estar activo aunque haya QT."""
        rep = reporte_base()
        rep["terapia_sistemica"]["recibio_qt"] = "1"
        rep["terapia_sistemica"]["primer_esquema"]["num_medicamentos"] = "0"
        activos = expandir_campos_activos(rep)
        for i in range(1, 10):
            assert f"terapia_sistemica.primer_esquema.med{i}" not in activos

    def test_medicamentos_ultimo_esquema_independiente(self):
        """Los medicamentos del último esquema tienen su propio contador (V66)."""
        rep = reporte_base()
        rep["terapia_sistemica"]["recibio_qt"] = "1"
        rep["terapia_sistemica"]["primer_esquema"]["num_medicamentos"] = "2"
        rep["terapia_sistemica"]["ultimo_esquema"]["num_medicamentos"] = "5"
        activos = expandir_campos_activos(rep)
        # Primer esquema: solo med1, med2
        assert "terapia_sistemica.primer_esquema.med1" in activos
        assert "terapia_sistemica.primer_esquema.med2" in activos
        assert "terapia_sistemica.primer_esquema.med3" not in activos
        # Último esquema: med1–med5
        for i in range(1, 6):
            assert f"terapia_sistemica.ultimo_esquema.med{i}" in activos
        assert "terapia_sistemica.ultimo_esquema.med6" not in activos


# ─── TEST FIX-04: Cuidados paliativos V114.x ──────────────────────────────

class TestCuidadosPaliativos:

    def test_sin_valoracion_no_activa_subgrupos(self):
        """Si valorado != 1, los subtipos V114.1–V114.6 no deben estar activos."""
        rep = reporte_base()
        rep["cuidados_paliativos"]["valorado"] = "2"
        activos = expandir_campos_activos(rep)
        for campo in [
            "cuidados_paliativos.med_especialista_paliativo",
            "cuidados_paliativos.prof_salud_especialista_paliativo",
            "cuidados_paliativos.med_especialista_otra",
            "cuidados_paliativos.med_general",
            "cuidados_paliativos.trabajo_social",
            "cuidados_paliativos.otro_prof_no_especializado",
        ]:
            assert campo not in activos, f"{campo} no debe estar activo sin valoración"

    def test_con_valoracion_activa_todos_subtipos(self):
        """Si valorado = 1, los 6 subtipos V114.1–V114.6 deben estar activos."""
        rep = reporte_base()
        rep["cuidados_paliativos"]["valorado"] = "1"
        activos = expandir_campos_activos(rep)
        for campo in [
            "cuidados_paliativos.med_especialista_paliativo",
            "cuidados_paliativos.prof_salud_especialista_paliativo",
            "cuidados_paliativos.med_especialista_otra",
            "cuidados_paliativos.med_general",
            "cuidados_paliativos.trabajo_social",
            "cuidados_paliativos.otro_prof_no_especializado",
        ]:
            assert campo in activos, f"{campo} debe estar activo cuando valorado=1"


# ─── TEST: Diagnóstico de grupos ───────────────────────────────────────────

class TestDiagnosticoGrupos:

    def test_diagnostico_devuelve_todos_los_grupos(self):
        rep = reporte_base()
        diag = diagnosticar_grupos(rep)
        for grupo in ["fases_qt", "medicamentos_primer", "medicamentos_ultimo", "cuidados_paliativos"]:
            assert grupo in diag

    def test_diagnostico_inactivo_cuando_sin_qt(self):
        rep = reporte_base()
        diag = diagnosticar_grupos(rep)
        assert diag["medicamentos_primer"]["activo"] is False
        assert diag["medicamentos_primer"]["campos_activos"] == 0

    def test_diagnostico_activo_con_3_medicamentos(self):
        rep = reporte_base()
        rep["terapia_sistemica"]["recibio_qt"] = "1"
        rep["terapia_sistemica"]["primer_esquema"]["num_medicamentos"] = "3"
        diag = diagnosticar_grupos(rep)
        assert diag["medicamentos_primer"]["activo"] is True
        assert diag["medicamentos_primer"]["campos_activos"] == 3
