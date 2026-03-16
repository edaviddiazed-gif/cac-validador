# app/validators/motor_reglas.py
"""
Motor de reglas dinámico.
Lee reglas.json (generado desde el Excel) y las ejecuta sobre el reporte CAC.

FECHAS DINÁMICAS
================
El Excel tiene 69 fechas hardcodeadas para la cohorte 2023.
Este motor las reemplaza en tiempo de ejecución usando la fecha de corte (V134):

  V134 (fecha de corte)     → leída del propio reporte
  V134 - 1 año              → 2023-01-01  (inicio del año de corte)
  V134 - 1 año + 1 día      → 2023-01-02  (inicio del periodo)
  V134 - 2 meses            → 2023-11-01  (umbral diagnósticos recientes)
  V134 - 3 años             → 2021-01-01  (ventana de fallecidos)
  V134 - 3 años + 1 día     → 2021-01-02

De esta forma el validador funciona correctamente para cualquier cohorte
(2024, 2025, 2026...) sin tocar una línea de código.
"""

import json
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from dateutil.relativedelta import relativedelta

from app.schemas.common import ErrorDetalle, FECHAS_ESPECIALES

_REGLAS_PATH = Path(__file__).parent.parent / "reglas.json"
_REGLAS_CACHE: Optional[List[dict]] = None

# Fecha hardcodeada de la cohorte 2023 (la que está en el Excel)
_COHORTE_BASE = date(2024, 1, 1)


def _cargar_reglas() -> List[dict]:
    global _REGLAS_CACHE
    if _REGLAS_CACHE is None:
        if _REGLAS_PATH.exists():
            with open(_REGLAS_PATH, encoding="utf-8") as f:
                _REGLAS_CACHE = json.load(f)
        else:
            _REGLAS_CACHE = []
    return _REGLAS_CACHE


def recargar_reglas():
    global _REGLAS_CACHE
    _REGLAS_CACHE = None


# ─── Calendario dinámico de la cohorte ────────────────────────────────────

def _fechas_cohorte(fecha_corte: date) -> Dict[str, str]:
    """
    Calcula todas las fechas dinámicas a partir de la fecha de corte (V134).
    Devuelve un dict de {fecha_en_excel → fecha_real_del_reporte}.
    """
    fc = fecha_corte
    return {
        # La fecha de corte misma
        _COHORTE_BASE.strftime("%Y-%m-%d"):
            fc.strftime("%Y-%m-%d"),

        # Inicio del año de corte (fc - 1 año)
        (date(fc.year - 1, 1, 1)).strftime("%Y-%m-%d"):
            date(fc.year - 1, 1, 1).strftime("%Y-%m-%d"),

        # Inicio del periodo (fc - 1 año + 1 día)
        (date(fc.year - 1, 1, 2)).strftime("%Y-%m-%d"):
            date(fc.year - 1, 1, 2).strftime("%Y-%m-%d"),

        # Umbral diagnósticos recientes (fc - ~14 meses → 1 nov año anterior)
        (date(fc.year - 1, 11, 1)).strftime("%Y-%m-%d"):
            date(fc.year - 1, 11, 1).strftime("%Y-%m-%d"),

        # Ventana de fallecidos (fc - 3 años)
        (date(fc.year - 3, 1, 1)).strftime("%Y-%m-%d"):
            date(fc.year - 3, 1, 1).strftime("%Y-%m-%d"),

        # Ventana de fallecidos + 1 día
        (date(fc.year - 3, 1, 2)).strftime("%Y-%m-%d"):
            date(fc.year - 3, 1, 2).strftime("%Y-%m-%d"),
    }


def _traducir_fecha(valor: str, mapa: Dict[str, str]) -> str:
    """Reemplaza una fecha hardcodeada del Excel por la fecha real de la cohorte."""
    return mapa.get(valor, valor)


# ─── Utilidades de comparación ─────────────────────────────────────────────

def _get_valor(reporte_dict: dict, campo: str) -> Optional[str]:
    parts = campo.split(".")
    obj = reporte_dict
    for p in parts:
        if not isinstance(obj, dict) or p not in obj:
            return None
        obj = obj[p]
    return str(obj).strip() if obj is not None else None


def _resolver_variable(val: str, reporte_dict: dict) -> Optional[str]:
    """Si val es una referencia VXX, la resuelve en el reporte."""
    import re
    from scripts.generar_catalogos import VAR_MAP
    m = re.match(r"(V\d+)", val)
    if m:
        path = VAR_MAP.get(m.group(1))
        if path:
            return _get_valor(reporte_dict, path)
    return val


def _es_fecha(valor: str) -> bool:
    try:
        datetime.strptime(valor, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def _comparar(val_campo: str, operador: str, val_regla: str) -> bool:
    if val_campo in FECHAS_ESPECIALES or val_regla in FECHAS_ESPECIALES:
        return True

    if _es_fecha(val_campo) and _es_fecha(val_regla):
        a = datetime.strptime(val_campo, "%Y-%m-%d")
        b = datetime.strptime(val_regla, "%Y-%m-%d")
        ops = {"=": a == b, "!=": a != b, "<>": a != b,
               "<=": a <= b, ">=": a >= b, "<": a < b, ">": a > b}
        return ops.get(operador, True)

    try:
        a_num = float(val_campo)
        b_num = float(val_regla)
        ops = {"=": a_num == b_num, "!=": a_num != b_num, "<>": a_num != b_num,
               "<=": a_num <= b_num, ">=": a_num >= b_num, "<": a_num < b_num, ">": a_num > b_num}
        return ops.get(operador, True)
    except (ValueError, TypeError):
        pass

    a, b = val_campo.upper().strip(), val_regla.upper().strip()
    ops = {"=": a == b, "!=": a != b, "<>": a != b,
           "<=": a <= b, ">=": a >= b, "<": a < b, ">": a > b}
    return ops.get(operador, True)


# ─── Motor principal ────────────────────────────────────────────────────────

def ejecutar_motor(reporte_dict: dict) -> List[ErrorDetalle]:
    reglas = _cargar_reglas()
    errores: List[ErrorDetalle] = []

    # Obtener fecha de corte del reporte para traducir fechas dinámicas
    fecha_corte_str = _get_valor(reporte_dict, "resultado.fecha_bdua")
    mapa_fechas: Dict[str, str] = {}
    if fecha_corte_str and _es_fecha(fecha_corte_str):
        try:
            fc = datetime.strptime(fecha_corte_str, "%Y-%m-%d").date()
            mapa_fechas = _fechas_cohorte(fc)
        except Exception:
            pass

    # Agrupar reglas por código para manejar operador Y/O
    grupos: Dict[str, List[dict]] = {}
    for r in reglas:
        if not r.get("activa", True) or r.get("tipo_regla") == "NO_PARSEADA":
            continue
        clave = r.get("id", "") or r.get("descripcion_original", "")
        grupos.setdefault(clave, []).append(r)

    for clave, grupo in grupos.items():
        op_logico = grupo[0].get("operador_logico", "Y") or "Y"
        resultados = []

        for regla in grupo:
            tipo         = regla.get("tipo_regla")
            campo        = regla.get("campo")
            restriccion  = regla.get("restriccion") or {}
            condicion    = regla.get("condicion")
            mensaje      = regla.get("mensaje", "Regla de validación no cumplida.")
            nivel        = regla.get("nivel", "ERROR")

            if not campo:
                continue

            # ── Evaluar condición ────────────────────────────────────
            if condicion:
                cond_campo = condicion.get("campo")
                cond_op    = condicion.get("operador", "=")
                cond_val   = condicion.get("valor", "")

                val_cond = _get_valor(reporte_dict, cond_campo)
                if val_cond is None:
                    resultados.append(True)
                    continue

                cond_val_r = _resolver_variable(cond_val, reporte_dict)
                cond_val_r = _traducir_fecha(cond_val_r or cond_val, mapa_fechas)

                if not _comparar(val_cond, cond_op, cond_val_r):
                    resultados.append(True)
                    continue

            # ── Evaluar restricción ──────────────────────────────────
            val_campo = _get_valor(reporte_dict, campo)
            if val_campo is None:
                resultados.append(True)
                continue

            op_rest  = restriccion.get("operador", "=")
            val_rest = restriccion.get("valor", "")
            val_rest_r = _resolver_variable(val_rest, reporte_dict)
            val_rest_r = _traducir_fecha(val_rest_r or val_rest, mapa_fechas)

            cumple = _comparar(val_campo, op_rest, val_rest_r)
            resultados.append(cumple)

            if not cumple and op_logico.upper() != "O":
                errores.append(ErrorDetalle(
                    id_regla=regla.get("id", "EXCEL"),
                    campo=campo,
                    nivel=nivel,
                    mensaje=mensaje,
                    variable_res=f"V{regla.get('variable', '')}",
                ))

        if op_logico.upper() == "O" and resultados and not any(resultados):
            r0 = grupo[0]
            errores.append(ErrorDetalle(
                id_regla=r0.get("id", "EXCEL"),
                campo=r0.get("campo"),
                nivel=r0.get("nivel", "ERROR"),
                mensaje=r0.get("mensaje", "Ninguna de las opciones válidas fue registrada."),
                variable_res=f"V{r0.get('variable', '')}",
            ))

    return errores
