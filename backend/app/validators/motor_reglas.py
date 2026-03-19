# app/validators/motor_reglas.py
"""
Motor de reglas dinámico.
Lee reglas.json (generado desde el Excel) y las ejecuta sobre el reporte CAC.

FECHAS DINÁMICAS
================
El Excel tiene fechas hardcodeadas para la cohorte 2023→2024.
Este motor las reemplaza en tiempo de ejecución usando la fecha de corte (V134)
del propio reporte, de modo que el validador funciona sin cambios de código
para cualquier cohorte futura (2024→2025, 2025→2026…).

Mapa de traducción (cohorte base 2024-01-01 → cohorte real):
  2024-01-01  → V134            (fecha de corte, la propia V134)
  2023-01-01  → V134 − 1 año   (inicio del año del período)
  2023-01-02  → V134 − 1 año + 1 día  (inicio del período de reporte)
  2023-11-01  → V134 − 2 meses (umbral diagnósticos recientes / cirugía en corte)
  2021-01-01  → V134 − 3 años  (ventana mínima fallecidos y tratamientos)
  2021-01-02  → V134 − 3 años + 1 día
  2005-01-01  → V134 − 19 años (umbral mayoría de edad para CC)
  2004-01-01  → V134 − 20 años (umbral edad pediátrica por CIE-10)
  2017-01-01  → V134 − 7 años  (umbral histórico datos comodín)

Fechas FIJAS (no se traducen):
  1993-01-01  → Fecha de creación del SGSSS Colombia (siempre fija)
  1900-01-01  → Límite inferior de fechas de nacimiento (siempre fija)
  1800-01-01  → Comodín "Desconocido"
  1840-01-01  → Comodín "No aplica mama in situ"
  1845-01-01  → Comodín "No aplica"
  1846-01-01  → Comodín "PPNA / ente territorial"
"""

import json
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from dateutil.relativedelta import relativedelta

from app.schemas.common import ErrorDetalle, FECHAS_ESPECIALES

_REGLAS_PATH = Path(__file__).parent.parent / "reglas.json"
_REGLAS_CACHE: Optional[List[dict]] = None

# ── Cohorte de referencia del Excel (2023 → corte 2024-01-01) ─────────────
_COHORTE_BASE = date(2024, 1, 1)

# Fechas especiales / comodines que NUNCA se traducen
_FECHAS_FIJAS = {
    "1993-01-01",  # Creación SGSSS - fija histórica
    "1900-01-01",  # Límite inferior fecha nacimiento
    "1800-01-01",  # Comodín desconocido
    "1840-01-01",  # Comodín no aplica mama in situ
    "1845-01-01",  # Comodín no aplica
    "1846-01-01",  # Comodín PPNA / ente territorial
}


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
    """Fuerza recarga del caché de reglas (útil tras regenerar reglas.json)."""
    global _REGLAS_CACHE
    _REGLAS_CACHE = None


# ─── Calendario dinámico de la cohorte ────────────────────────────────────

def _fechas_cohorte(fecha_corte: date) -> Dict[str, str]:
    """
    Construye el mapa {fecha_excel → fecha_real} para la cohorte del reporte.

    Recibe la fecha de corte del propio reporte (V134) y devuelve todas las
    fechas dinámicas traducidas. Las fechas fijas (1993-01-01, comodines, etc.)
    NO se incluyen y el motor las deja pasar sin traducción.
    """
    fc = fecha_corte
    base = _COHORTE_BASE  # 2024-01-01

    def fmt(d: date) -> str:
        return d.strftime("%Y-%m-%d")

    # Si la fecha de corte ya coincide con la base, el mapa es trivial
    if fc == base:
        return {}

    return {
        # La fecha de corte misma
        fmt(base):                              fmt(fc),
        # Inicio del año del período (fc - 1 año)
        fmt(base - relativedelta(years=1)):     fmt(fc - relativedelta(years=1)),
        # Inicio del período (fc - 1 año + 1 día)
        fmt(base - relativedelta(years=1) + timedelta(days=1)):
                                                fmt(fc - relativedelta(years=1) + timedelta(days=1)),
        # Umbral diagnósticos recientes (fc - 2 meses)
        fmt(base - relativedelta(months=2)):    fmt(fc - relativedelta(months=2)),
        # Ventana mínima fallecidos y tratamientos (fc - 3 años)
        fmt(base - relativedelta(years=3)):     fmt(fc - relativedelta(years=3)),
        # Ventana + 1 día
        fmt(base - relativedelta(years=3) + timedelta(days=1)):
                                                fmt(fc - relativedelta(years=3) + timedelta(days=1)),
        # Umbral mayoría de edad para CC (fc - 19 años)
        fmt(base - relativedelta(years=19)):    fmt(fc - relativedelta(years=19)),
        # Umbral edad pediátrica por CIE-10 (fc - 20 años)
        fmt(base - relativedelta(years=20)):    fmt(fc - relativedelta(years=20)),
        # Umbral histórico datos comodín (fc - 7 años)
        fmt(base - relativedelta(years=7)):     fmt(fc - relativedelta(years=7)),
    }


def _traducir_fecha(valor: str, mapa: Dict[str, str]) -> str:
    """
    Si el valor es una fecha dinámica hardcodeada del Excel, la traduce
    a la fecha equivalente de la cohorte real. Las fechas fijas y los
    comodines (18xx-...) se devuelven sin cambio.
    """
    if not valor or valor in _FECHAS_FIJAS:
        return valor
    return mapa.get(valor, valor)


# ─── Utilidades de acceso y comparación ────────────────────────────────────

def _get_valor(reporte_dict: dict, campo: str) -> Optional[str]:
    """Navega un path 'a.b.c' en el dict del reporte."""
    parts = campo.split(".")
    obj = reporte_dict
    for p in parts:
        if not isinstance(obj, dict) or p not in obj:
            return None
        obj = obj[p]
    return str(obj).strip() if obj is not None else None


def _resolver_variable(val: str, reporte_dict: dict, var_map: dict) -> Optional[str]:
    """Si val es una referencia 'V{n}', la resuelve buscando su valor en el reporte."""
    import re
    m = re.match(r"(V\d+(?:\.\d+)?)", val)
    if m:
        path = var_map.get(m.group(1))
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
    """
    Compara val_campo {operador} val_regla.
    Prioridad: fechas especiales → fechas → números → strings.
    Las fechas especiales (comodines) siempre pasan la comparación.
    """
    # Comodines y fechas especiales siempre válidas
    if val_campo in FECHAS_ESPECIALES or val_regla in FECHAS_ESPECIALES:
        return True

    # Comparación de fechas
    if _es_fecha(val_campo) and _es_fecha(val_regla):
        a = datetime.strptime(val_campo, "%Y-%m-%d")
        b = datetime.strptime(val_regla, "%Y-%m-%d")
        return _cmp(a, operador, b)

    # Comparación numérica
    try:
        a_num = float(val_campo)
        b_num = float(val_regla)
        return _cmp(a_num, operador, b_num)
    except (ValueError, TypeError):
        pass

    # Comparación de strings (case-insensitive)
    a = val_campo.upper().strip()
    b = val_regla.upper().strip()
    return _cmp(a, operador, b)


def _cmp(a, op: str, b) -> bool:
    ops = {
        "=":  a == b, "!=": a != b, "<>": a != b,
        "<=": a <= b, ">=": a >= b,
        "<":  a <  b, ">":  a >  b,
    }
    return ops.get(op.strip(), True)


# ─── Motor principal ────────────────────────────────────────────────────────

def ejecutar_motor(reporte_dict: dict) -> List[ErrorDetalle]:
    """
    Ejecuta todas las reglas del Excel sobre el reporte CAC.

    Las reglas tipo DEFINICION (De estructura) validan que el campo tenga
    un valor no vacío y reconocido. Las reglas tipo CONDICIONAL y SIMPLE
    aplican restricciones lógicas entre campos.
    """
    from scripts.generar_catalogos import VAR_MAP

    reglas = _cargar_reglas()
    errores: List[ErrorDetalle] = []

    # ── Calcular mapa de fechas dinámicas ──────────────────────────────────
    fecha_corte_str = _get_valor(reporte_dict, "resultado.fecha_bdua")
    mapa_fechas: Dict[str, str] = {}
    if fecha_corte_str and _es_fecha(fecha_corte_str):
        try:
            fc = datetime.strptime(fecha_corte_str, "%Y-%m-%d").date()
            mapa_fechas = _fechas_cohorte(fc)
        except Exception:
            pass

    # ── Agrupar reglas por código de error para manejar operador Y/O ──────
    # Cada grupo de reglas con el mismo código se evalúa conjuntamente:
    #   Y (AND): todas deben cumplirse → error si alguna falla
    #   O (OR):  al menos una debe cumplirse → error solo si NINGUNA cumple
    grupos: Dict[str, List[dict]] = {}
    for r in reglas:
        if not r.get("activa", True):
            continue
        tipo = r.get("tipo_regla", "")
        if tipo in ("NO_PARSEADA",):
            continue
        # Las reglas DEFINICION se ejecutan individualmente (sin agrupar por Y/O)
        if tipo == "DEFINICION":
            _evaluar_definicion(r, reporte_dict, errores)
            continue
        clave = r.get("id") or r.get("descripcion_original", "")
        grupos.setdefault(clave, []).append(r)

    # ── Evaluar grupos CONDICIONAL / SIMPLE ───────────────────────────────
    for clave, grupo in grupos.items():
        op_logico = (grupo[0].get("operador_logico") or "Y").strip().upper()
        resultados_grupo: List[bool] = []

        for regla in grupo:
            cumple = _evaluar_regla(regla, reporte_dict, mapa_fechas, VAR_MAP)
            resultados_grupo.append(cumple)

            # En modo Y: reportar error en cuanto falle una
            if not cumple and op_logico != "O":
                errores.append(ErrorDetalle(
                    id_regla=regla.get("id", "EXCEL"),
                    campo=regla.get("campo"),
                    nivel=regla.get("nivel", "ERROR"),
                    mensaje=regla.get("mensaje", "Regla de validación no cumplida."),
                    variable_res=f"V{regla.get('variable', '')}",
                ))

        # En modo O: error solo si NINGUNA opción fue válida
        if op_logico == "O" and resultados_grupo and not any(resultados_grupo):
            r0 = grupo[0]
            errores.append(ErrorDetalle(
                id_regla=r0.get("id", "EXCEL"),
                campo=r0.get("campo"),
                nivel=r0.get("nivel", "ERROR"),
                mensaje=r0.get("mensaje", "Ninguna de las opciones válidas fue registrada."),
                variable_res=f"V{r0.get('variable', '')}",
            ))

    return errores


def _evaluar_definicion(
    regla: dict,
    reporte_dict: dict,
    errores: List[ErrorDetalle],
) -> None:
    """
    Valida que el campo de una regla DEFINICION no sea vacío ni None.
    Estas reglas corresponden a los errores «De estructura» del Excel.
    Solo se activan si el campo existe en el reporte y tiene un valor vacío.
    """
    campo = regla.get("campo")
    if not campo:
        return
    val = _get_valor(reporte_dict, campo)
    # Si el campo simplemente no existe en el JSON no penalizamos
    # (podría ser un campo opcional de otro módulo)
    if val is None:
        return
    if val.strip() == "":
        errores.append(ErrorDetalle(
            id_regla=regla.get("id", "EXCEL-DEF"),
            campo=campo,
            nivel="ERROR",
            mensaje=regla.get("mensaje") or f"El campo '{campo}' no puede estar vacío.",
            variable_res=f"V{regla.get('variable', '')}",
        ))


def _evaluar_regla(
    regla: dict,
    reporte_dict: dict,
    mapa_fechas: Dict[str, str],
    var_map: dict,
) -> bool:
    """
    Evalúa una regla CONDICIONAL o SIMPLE.

    CONDICIONAL: si la condición se cumple, entonces la restricción debe cumplirse.
    SIMPLE:      la restricción siempre debe cumplirse.

    Retorna True si la regla se cumple (sin error), False si hay infracción.
    """
    campo       = regla.get("campo")
    restriccion = regla.get("restriccion") or {}
    condicion   = regla.get("condicion")

    if not campo:
        return True

    # ── Evaluar condición (si existe) ─────────────────────────────────────
    if condicion:
        cond_campo = condicion.get("campo")
        cond_op    = condicion.get("operador", "=")
        cond_val   = condicion.get("valor", "")

        val_cond = _get_valor(reporte_dict, cond_campo)
        if val_cond is None:
            return True  # campo condición ausente → regla no aplica

        cond_val_r = _resolver_variable(cond_val, reporte_dict, var_map)
        cond_val_r = _traducir_fecha(cond_val_r or cond_val, mapa_fechas)

        if not _comparar(val_cond, cond_op, cond_val_r):
            return True  # condición no se cumple → restricción no aplica

    # ── Evaluar restricción ────────────────────────────────────────────────
    val_campo = _get_valor(reporte_dict, campo)
    if val_campo is None:
        return True  # campo ausente → no se puede validar

    op_rest  = restriccion.get("operador", "=")
    val_rest = restriccion.get("valor", "")
    val_rest_r = _resolver_variable(val_rest, reporte_dict, var_map)
    val_rest_r = _traducir_fecha(val_rest_r or val_rest, mapa_fechas)

    return _comparar(val_campo, op_rest, val_rest_r)
