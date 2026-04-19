"""
tests/test_api.py — Tests de integracion de la API CAC v2
===========================================================
Requiere: pip install httpx pytest

Ejecutar:
    cd cac-validador-v2/backend
    pytest tests/test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

REGLAS_MOCK = {
    "reglas": [],
    "_meta": {"version": "2.0", "total_reglas": 0, "grupos_dinamicos": {}}
}

with patch("app.main._cargar_reglas", return_value=REGLAS_MOCK):
    from app.main import app

client = TestClient(app)


# ─── Healthcheck ───────────────────────────────────────────────────────────

def test_salud_ok():
    r = client.get("/salud")
    assert r.status_code == 200
    assert r.json()["estado"] == "ok"

def test_info_ok():
    r = client.get("/info")
    assert r.status_code == 200
    data = r.json()
    assert "total_reglas" in data
    assert "version" in data


# ─── Validar registro ──────────────────────────────────────────────────────

REPORTE_MINIMO = {
    "paciente": {"tipo_id": "CC", "sexo": "M"},
    "diagnostico": {"cie10_neoplasia_primaria": "C61"},
    "terapia_sistemica": {"recibio_qt": "2"},
    "cirugia": {"recibio_cirugia": "2"},
    "radioterapia": {"recibio_rt": "2"},
    "trasplante": {"recibio_trasplante": "2"},
    "cirugia_reconstructiva": {"recibio_cx_rec": "2"},
    "cuidados_paliativos": {"valorado": "2"},
    "resultado": {"estado_vital": "1"},
}

def test_validar_registro_estructura_respuesta():
    r = client.post("/validar-registro", json=REPORTE_MINIMO)
    assert r.status_code == 200
    data = r.json()
    assert "valido" in data
    assert "total_errores" in data
    assert "errores" in data
    assert "errores_por_seccion" in data
    assert isinstance(data["errores"], list)

def test_validar_registro_vacio():
    r = client.post("/validar-registro", json={})
    assert r.status_code == 200

def test_validar_registro_devuelve_campo_en_error():
    """Cada error debe tener campo, id, tipo_error, descripcion, nivel."""
    with patch("app.main.ejecutar_motor", return_value=[
        {"id": "E001", "campo": "paciente.tipo_id", "tipo_error": "estructura",
         "descripcion": "Campo obligatorio", "nivel": "ERROR"}
    ]):
        r = client.post("/validar-registro", json=REPORTE_MINIMO)
        assert r.status_code == 200
        errores = r.json()["errores"]
        assert len(errores) == 1
        assert errores[0]["campo"] == "paciente.tipo_id"
        assert errores[0]["nivel"] == "ERROR"

def test_validar_registro_sin_errores_es_valido():
    with patch("app.main.ejecutar_motor", return_value=[]):
        r = client.post("/validar-registro", json=REPORTE_MINIMO)
        assert r.json()["valido"] is True
        assert r.json()["total_errores"] == 0


# ─── Validar archivo ───────────────────────────────────────────────────────

CSV_VALIDO = (
    "paciente.tipo_id,paciente.sexo,diagnostico.cie10_neoplasia_primaria\n"
    "CC,M,C61\n"
    "TI,F,C50\n"
)

def test_validar_archivo_csv():
    with patch("app.main.ejecutar_motor", return_value=[]):
        r = client.post(
            "/validar-archivo",
            files={"archivo": ("test.csv", CSV_VALIDO.encode(), "text/csv")},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["total_registros"] == 2
        assert "registros_validos" in data
        assert "resultados" in data

def test_validar_archivo_vacio():
    r = client.post(
        "/validar-archivo",
        files={"archivo": ("vacio.csv", b"", "text/csv")},
    )
    assert r.status_code == 400
