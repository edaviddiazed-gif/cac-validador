# app/validators/__init__.py
"""
Motor de validación del CAC — Resolución 0247 de 2023.
Orquesta TRES capas:
  1. base.py        — Formato de fechas + coherencia temporal
  2. clinicos.py    — Coherencia clínica por tipo de tumor (CIE-10)
  3. motor_reglas.py — Reglas dinámicas extraídas del Excel oficial (reglas.json)
"""
from typing import List
from app.schemas.cac import CACReport
from app.schemas.common import ErrorDetalle, ValidationResponse
from .base import validar_formato_fechas, validar_coherencia_temporal
from .clinicos import (
    validar_obligatorios,
    validar_tipo_cancer,
    validar_tratamientos,
    validar_estado_vital,
)
from .motor_reglas import ejecutar_motor

SECCIONES_CAMPO = {
    "paciente": "identificacion",
    "diagnostico": "diagnostico",
    "terapia_sistemica": "terapia_sistemica",
    "cirugia": "cirugia",
    "radioterapia": "radioterapia",
    "trasplante": "trasplante",
    "cirugia_reconstructiva": "cirugia_reconstructiva",
    "cuidados_paliativos": "cuidados_paliativos",
    "soporte": "soporte",
    "resultado": "resultado",
}


def _seccion(campo: str) -> str:
    if not campo:
        return "general"
    for prefix, seccion in SECCIONES_CAMPO.items():
        if campo.startswith(prefix):
            return seccion
    return "general"


def ejecutar_validaciones(reporte: CACReport) -> ValidationResponse:
    todos: List[ErrorDetalle] = []
    generales: List[ErrorDetalle] = []

    # Capa 1: formato y coherencia temporal (código Python)
    todos.extend(validar_formato_fechas(reporte))
    todos.extend(validar_coherencia_temporal(reporte))

    # Capa 2: coherencia clínica por tipo de tumor (código Python)
    todos.extend(validar_obligatorios(reporte))
    todos.extend(validar_tipo_cancer(reporte))
    todos.extend(validar_tratamientos(reporte))
    todos.extend(validar_estado_vital(reporte))

    # Capa 3: motor de reglas dinámico desde Excel → reglas.json
    reporte_dict = reporte.model_dump()
    todos.extend(ejecutar_motor(reporte_dict))

    # Separar errores con campo de los generales
    errores_campo = [e for e in todos if e.campo]
    errores_gen   = [e for e in todos if not e.campo]
    errores_gen.extend(generales)

    # Agrupar por campo
    por_campo: dict = {}
    for e in errores_campo:
        por_campo.setdefault(e.campo, []).append(e.dict())

    # Resumen por sección
    secciones = {}
    for e in todos:
        sec = _seccion(e.campo or "")
        if sec not in secciones:
            secciones[sec] = {"criticos": 0, "advertencias": 0}
        if e.nivel == "ERROR":
            secciones[sec]["criticos"] += 1
        else:
            secciones[sec]["advertencias"] += 1

    criticos = sum(1 for e in todos if e.nivel == "ERROR")
    advertencias = sum(1 for e in todos if e.nivel == "ADVERTENCIA")

    return ValidationResponse(
        valido=(criticos == 0),
        total_errores=criticos,
        total_advertencias=advertencias,
        errores_por_campo=por_campo,
        errores_generales=[e.dict() for e in errores_gen],
        resumen_por_seccion=secciones,
    )
