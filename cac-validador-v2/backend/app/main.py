"""
main.py — FastAPI CAC-Validador v2
====================================
Motor de validacion expuesto como API REST.

Endpoints:
  GET  /salud               → healthcheck
  GET  /info                → metadata del motor
  POST /validar-registro    → valida 1 reporte JSON
  POST /validar-archivo     → valida CSV/TXT plano (multiples registros)

Correr en desarrollo:
  uvicorn app.main:app --reload --port 8000

Correr en produccion:
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
"""

from __future__ import annotations
import json
import csv
import io
import time
import logging
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas.schema import ReporteCAC, ResultadoValidacion, ErrorValidacion, InfoMotor
from app.validators.motor_reglas import ejecutar_motor
from app.validators.expansion import expandir_campos_activos

logger = logging.getLogger("cac_api")

# ─── Cargar reglas al arrancar ────────────────────────────────────────────
REGLAS_PATH = Path(__file__).parent / "reglas.json"
CATALOGOS_PATH = Path(__file__).parent / "catalogos.json"

def _cargar_catalogos() -> Dict:
    if not CATALOGOS_PATH.exists():
        return {}
    with open(CATALOGOS_PATH, encoding="utf-8") as f:
        return json.load(f)

def _cargar_reglas() -> Dict:
    if not REGLAS_PATH.exists():
        raise RuntimeError(f"reglas.json no encontrado en {REGLAS_PATH}")
    with open(REGLAS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    logger.info(f"reglas.json cargado: {len(data.get('reglas', []))} reglas")
    return data

REGLAS_DATA: Dict = {}
CATALOGOS_DATA: Dict = {}

# ─── App FastAPI ──────────────────────────────────────────────────────────
app = FastAPI(
    title="CAC-Validador API",
    description="Motor de validacion de reportes de cancer - Resolucion 0247/2014",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    global REGLAS_DATA, CATALOGOS_DATA
    REGLAS_DATA = _cargar_reglas()
    CATALOGOS_DATA = _cargar_catalogos()
    logger.info("API CAC-Validador v2.0 iniciada")


# ─── Endpoints ────────────────────────────────────────────────────────────

@app.get("/salud", tags=["Sistema"])
def salud():
    """Healthcheck basico."""
    total = len(REGLAS_DATA.get("reglas", []))
    return {"estado": "ok", "reglas_cargadas": total, "version": "2.0.0"}


@app.get("/info", response_model=InfoMotor, tags=["Sistema"])
def info():
    """Metadata del motor: total reglas, tipos, grupos dinamicos."""
    reglas = REGLAS_DATA.get("reglas", [])
    tipos: Dict[str, int] = {}
    for r in reglas:
        t = r.get("tipo_error", "desconocido")
        tipos[t] = tipos.get(t, 0) + 1

    meta = REGLAS_DATA.get("_meta", {})
    grupos = list(meta.get("grupos_dinamicos", {}).keys()) if meta else [
        "fases_qt", "medicamentos_primer", "medicamentos_ultimo", "cuidados_paliativos"
    ]

    return InfoMotor(
        version="2.0.0",
        total_reglas=len(reglas),
        tipos_reglas=tipos,
        grupos_dinamicos=grupos,
        estado="activo",
    )


@app.get("/catalogos", tags=["Sistema"])
def get_catalogos():
    """Retorna todos los catalogos (EPS, Tipos ID, etc.) para el frontend."""
    return CATALOGOS_DATA


@app.post("/validar-registro", response_model=ResultadoValidacion, tags=["Validacion"])
def validar_registro(reporte: ReporteCAC):
    """
    Valida un unico registro CAC.

    Recibe la estructura completa del reporte en JSON y devuelve
    la lista de errores encontrados segun las 2993 reglas del motor.

    Ejemplo de body:
    ```json
    {
      "paciente": { "tipo_id": "CC", "sexo": "M", ... },
      "diagnostico": { "cie10_neoplasia_primaria": "C61", ... },
      ...
    }
    ```
    """
    t0 = time.perf_counter()
    try:
        reporte_dict = reporte.to_dict()
        campos_activos = expandir_campos_activos(reporte_dict)
        errores_raw = ejecutar_motor(reporte_dict, REGLAS_DATA["reglas"], campos_activos)
    except Exception as e:
        logger.exception("Error en motor de validacion")
        raise HTTPException(status_code=500, detail=f"Error en motor: {str(e)}")

    errores = _mapear_errores(errores_raw)
    advertencias = [e for e in errores if e.nivel == "ADVERTENCIA"]
    errores_reales = [e for e in errores if e.nivel == "ERROR"]

    por_seccion: Dict[str, int] = {}
    for e in errores:
        seccion = e.campo.split(".")[0] if "." in e.campo else "general"
        por_seccion[seccion] = por_seccion.get(seccion, 0) + 1

    ms = round((time.perf_counter() - t0) * 1000, 2)
    logger.info(f"Validacion completada en {ms}ms — {len(errores_reales)} errores, {len(advertencias)} advertencias")

    return ResultadoValidacion(
        valido=len(errores_reales) == 0,
        total_errores=len(errores_reales),
        total_advertencias=len(advertencias),
        errores=errores,
        errores_por_seccion=por_seccion,
        motor_version="2.0",
    )


@app.post("/validar-archivo", tags=["Validacion"])
async def validar_archivo(
    archivo: UploadFile = File(..., description="Archivo CSV o TXT con registros CAC"),
    max_registros: int = Query(default=1000, le=5000, description="Maximo de registros a procesar"),
):
    """
    Valida un archivo plano CSV con multiples registros CAC.

    Devuelve un resumen por archivo y los errores agrupados por numero de registro.
    Formato esperado: CSV con cabecera donde cada columna es un campo del reporte.
    """
    contenido = await archivo.read()
    try:
        texto = contenido.decode("utf-8-sig")
    except UnicodeDecodeError:
        texto = contenido.decode("latin-1")

    reader = csv.DictReader(io.StringIO(texto))
    filas = list(reader)[:max_registros]

    if not filas:
        raise HTTPException(status_code=400, detail="El archivo esta vacio o no tiene el formato correcto")

    resultados = []
    total_errores = 0

    for i, fila in enumerate(filas, start=1):
        reporte_dict = _csv_fila_a_reporte(fila)
        campos_activos = expandir_campos_activos(reporte_dict)
        try:
            errores_raw = ejecutar_motor(reporte_dict, REGLAS_DATA["reglas"], campos_activos)
        except Exception as e:
            errores_raw = [{"id": "MOTOR_ERROR", "campo": "sistema", "tipo_error": "sistema",
                           "descripcion": str(e), "nivel": "ERROR"}]

        errores = _mapear_errores(errores_raw)
        total_errores += len([e for e in errores if e.nivel == "ERROR"])
        resultados.append({
            "registro": i,
            "valido": len([e for e in errores if e.nivel == "ERROR"]) == 0,
            "num_errores": len(errores),
            "errores": [e.model_dump() for e in errores],
        })

    return {
        "archivo": archivo.filename,
        "total_registros": len(filas),
        "registros_validos": sum(1 for r in resultados if r["valido"]),
        "registros_con_errores": sum(1 for r in resultados if not r["valido"]),
        "total_errores_globales": total_errores,
        "resultados": resultados,
    }


# ─── Helpers internos ─────────────────────────────────────────────────────

def _mapear_errores(errores_raw: list) -> List[ErrorValidacion]:
    """Convierte la lista cruda del motor a modelos Pydantic."""
    result = []
    for e in errores_raw:
        result.append(ErrorValidacion(
            id=str(e.get("id", "SIN_ID")),
            campo=str(e.get("campo", "desconocido")),
            tipo_error=str(e.get("tipo_error", "desconocido")),
            descripcion=str(e.get("descripcion", e.get("desc", "Sin descripcion"))),
            detalle=e.get("detalle"),
            nivel=str(e.get("nivel", "ERROR")),
        ))
    return result


def _csv_fila_a_reporte(fila: Dict[str, str]) -> Dict:
    """
    Convierte una fila CSV plana a la estructura de reporte anidada.
    Soporta columnas con notacion punto: paciente.tipo_id, diagnostico.cie10, etc.
    """
    reporte: Dict[str, Any] = {}
    for clave, valor in fila.items():
        if not clave:
            continue
        partes = clave.strip().split(".")
        nodo = reporte
        for parte in partes[:-1]:
            if parte not in nodo:
                nodo[parte] = {}
            nodo = nodo[parte]
        nodo[partes[-1]] = valor.strip() if valor else None
    return reporte
