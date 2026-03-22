# app/validators/motor_reglas.py
"""
Motor de reglas dinámico.
Lee reglas.json (generado desde el Excel) y las ejecuta sobre el reporte CAC.

FECHAS DINÁMICAS (relativas a la fecha de corte)
================================================
El Excel tiene fechas hardcodeadas para la cohorte 2023→2024 (base 2024-01-01).
Este motor las traduce en tiempo de ejecución, permitiendo validar cualquier
cohorte futura sin cambios de código.

Las 9 fechas dinámicas y su offset respecto a la fecha de corte:

  Excel base   │ Fórmula           │ Ejemplo cohorte 2026→2027
  ─────────────┼───────────────────┼───────────────────────────
  2024-01-01   │ fecha_corte       │ 2027-01-01
  2023-01-01   │ fecha_corte − 1a  │ 2026-01-01
  2023-01-02   │ fecha_corte −1a+1d│ 2026-01-02  ← inicio automático
  2023-11-01   │ fecha_corte − 2m  │ 2026-11-01  (umbral dx recientes)
  2021-01-01   │ fecha_corte − 3a  │ 2024-01-01  (ventana fallecidos)
  2021-01-02   │ fecha_corte −3a+1d│ 2024-01-02  (ventana cirugía/RT)
  2017-01-01   │ fecha_corte − 7a  │ 2020-01-01  (umbral histórico remisión)
  2005-01-01   │ fecha_corte − 19a │ 2008-01-01  (mayoría de edad CC)
  2004-01-01   │ fecha_corte − 20a │ 2007-01-01  (umbral pediátrico CIE-10)

NOTA sobre 2023-01-01 vs fecha_inicio configurable:
  La fecha 2023-01-01 del Excel (inicio del período) puede ser sobreescrita
  por la fecha_inicio configurada en config_cohorte.py. Esto permite ajustar
  el período exacto de reporte (ej: si el período inicia el 2026-02-02 en
  lugar del 2026-01-02 automático).

Fechas FIJAS (nunca se traducen):
  1800-01-01  → Comodín: Desconocido
  1840-01-01  → Comodín: No aplica (mama in situ)
  1845-01-01  → Comodín: No aplica
  1846-01-01  → Comodín: PPNA / ente territorial
  1900-01-01  → Límite inferior fecha nacimiento
  1993-01-01  → Creación del SGSSS Colombia
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

# Fechas que NUNCA se traducen — comodines semánticos y límites del SGSSS
_FECHAS_FIJAS = {
    "1800-01-01",  # Comodín: Desconocido
    "1840-01-01",  # Comodín: No aplica (mama in situ)
    "1845-01-01",  # Comodín: No aplica
    "1846-01-01",  # Comodín: PPNA / ente territorial
    "1900-01-01",  # Límite inferior fecha nacimiento
    "1993-01-01",  # Creación del SGSSS Colombia
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

def _fechas_cohorte(fecha_corte: date, fecha_inicio: Optional[date] = None) -> Dict[str, str]:
    """
    Construye el mapa {fecha_excel_base → fecha_real} para la cohorte activa.

    Parámetros:
      fecha_corte:  fecha de corte efectiva (V134 o la configurada manualmente)
      fecha_inicio: fecha de inicio del período (configurable por el admin).
                    Si es None se calcula como fecha_corte − 1 año + 1 día.

    Las 9 fechas dinámicas se mapean usando sus offsets fijos respecto a la
    fecha de corte. La fecha de inicio (2023-01-02 en la base) puede ser
    sobreescrita por el valor configurado en config_cohorte.
    """
    fc   = fecha_corte
    base = _COHORTE_BASE  # 2024-01-01

    def fmt(d: date) -> str:
        return d.strftime("%Y-%m-%d")

    # Fecha de inicio del período:
    # - Si el admin configuró una → usarla
    # - Si no → fecha_corte − 1 año + 1 día (igual que el Excel base)
    fi = fecha_inicio if fecha_inicio else (fc - relativedelta(years=1) + timedelta(days=1))

    mapa = {
        # Fecha de corte (fin del período)
        fmt(base):                                                fmt(fc),
        # Inicio del período − 1 año (2023-01-01 en la base)
        fmt(base - relativedelta(years=1)):                       fmt(fc - relativedelta(years=1)),
        # Inicio del período configurable (2023-01-02 en la base)
        fmt(base - relativedelta(years=1) + timedelta(days=1)):   fmt(fi),
        # Umbral diagnósticos recientes (fc − 2 meses)
        fmt(base - relativedelta(months=2)):                      fmt(fc - relativedelta(months=2)),
        # Ventana fallecidos / tratamientos (fc − 3 años)
        fmt(base - relativedelta(years=3)):                       fmt(fc - relativedelta(years=3)),
        # Ventana + 1 día
        fmt(base - relativedelta(years=3) + timedelta(days=1)):   fmt(fc - relativedelta(years=3) + timedelta(days=1)),
        # Umbral histórico remisión (fc − 7 años)
        fmt(base - relativedelta(years=7)):                       fmt(fc - relativedelta(years=7)),
        # Mayoría de edad CC (fc − 19 años)
        fmt(base - relativedelta(years=19)):                      fmt(fc - relativedelta(years=19)),
        # Umbral pediátrico CIE-10 (fc − 20 años)
        fmt(base - relativedelta(years=20)):                      fmt(fc - relativedelta(years=20)),
    }
    return mapa


def _traducir_fecha(valor: str, mapa: Dict[str, str]) -> str:
    """
    Si el valor es una fecha dinámica del Excel base, la traduce a la cohorte
    real. Las fechas fijas (_FECHAS_FIJAS) se devuelven sin cambio.
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
    """
    Si val es una referencia 'V{n}', la resuelve buscando su valor en el reporte.
    Si la referencia existe en var_map pero el campo es None/vacío en el reporte,
    devuelve None para que _evaluar_regla pueda omitir la validación.
    Si val no es una referencia V-number, lo devuelve tal cual.
    """
    import re
    m = re.match(r"(V\d+(?:\.\d+)?)", val)
    if m:
        path = var_map.get(m.group(1))
        if path:
            return _get_valor(reporte_dict, path)  # None si el campo no existe
        # V-number reconocido pero sin path → devolver None
        return None
    return val


def _es_fecha(valor: str) -> bool:
    try:
        datetime.strptime(valor, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def _comparar(val_campo: Optional[str], operador: str, val_regla: Optional[str],
              bypass_centinela: bool = True) -> bool:
    """
    Compara val_campo {operador} val_regla.

    bypass_centinela=True (defecto, para RESTRICCIONES):
      Si algún operando es una fecha centinela y el operador es de rango,
      devuelve True (la restricción no aplica).

    bypass_centinela=False (para CONDICIONES):
      Las fechas centinela se comparan normalmente. Esto permite que
      condiciones como 'fecha_dukes > 1846-01-01' evalúen correctamente:
      si fecha_dukes=1845-01-01 → 1845 > 1846 = False → condición no aplica.

    Si algún valor es None (campo no resuelto), devuelve True (omite).
    """
    if val_campo is None or val_regla is None:
        return True
    # Fechas centinela con operador de rango
    if bypass_centinela:
        if val_campo in FECHAS_ESPECIALES and operador in ("<", ">", "<=", ">="):
            return True
        if val_regla in FECHAS_ESPECIALES and operador in ("<", ">", "<=", ">="):
            return True

    # Comparación de fechas (incluye centinelas con = y <>)
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

    Fecha de corte: usa config_cohorte si está configurada, si no usa V134.
    Fecha de inicio: usa config_cohorte si está configurada, si no calcula
                     automáticamente como fecha_corte − 1 año + 1 día.
    """
    from scripts.generar_catalogos import VAR_MAP
    from app.config_cohorte import resolver_fecha_corte, resolver_fecha_inicio

    reglas = _cargar_reglas()
    errores: List[ErrorDetalle] = []

    # ── Resolver fecha de corte y fecha de inicio ──────────────────────────
    fecha_corte_str = _get_valor(reporte_dict, "resultado.fecha_bdua")
    mapa_fechas: Dict[str, str] = {}

    # Fallback: si resultado.fecha_bdua está vacío, usar cabecera.fecha_corte
    if not fecha_corte_str:
        fecha_corte_str = _get_valor(reporte_dict, "cabecera.fecha_corte")

    # Inyectar fecha_corte en resultado.fecha_bdua del dict para que
    # _resolver_variable encuentre V134 aunque el campo real esté vacío
    if fecha_corte_str and not _get_valor(reporte_dict, "resultado.fecha_bdua"):
        reporte_dict.setdefault("resultado", {})["fecha_bdua"] = fecha_corte_str

    fc = resolver_fecha_corte(fecha_corte_str)
    if fc:
        fi = resolver_fecha_inicio(fc)
        mapa_fechas = _fechas_cohorte(fc, fi)

    # ── Agrupar reglas por código de error para manejar operador Y/O ──────
    #
    # GRAMÁTICA Y/O del Excel CAC:
    # Cada fila tiene un marcador Y/O que indica su relación con la fila SIGUIENTE:
    #   "Y"  → esta fila se agrupa AND con la siguiente (y las siguientes "Y")
    #   "O"  → esta fila es una alternativa OR independiente
    #   ""   → última fila del grupo, alternativa OR independiente
    #
    # La evaluación final: OR de sub-grupos AND.
    # El código falla solo si NINGÚN sub-grupo AND pasa completamente.
    #
    # Ejemplo B4824 (V21 tipo_estudio):
    #   [Y ] >= 1  ─┐ AND
    #   [O ] <= 10  ─┘ → (>=1 AND <=10) OR =99 OR =55
    #   [O ] = 99
    #   [  ] = 55
    # val=10 es VÁLIDO porque pasa el primer sub-grupo AND.
    grupos: Dict[str, List[dict]] = {}
    for r in reglas:
        if not r.get("activa", True):
            continue
        tipo = r.get("tipo_regla", "")
        if tipo == "NO_PARSEADA":
            continue
        if tipo == "DEFINICION":
            _evaluar_definicion(r, reporte_dict, errores)
            continue
        clave = r.get("id") or r.get("descripcion_original", "")
        grupos.setdefault(clave, []).append(r)

    # ── Evaluar grupos CONDICIONAL / SIMPLE ───────────────────────────────
    for clave, grupo in grupos.items():
        if not grupo:
            continue

        # Construir sub-grupos AND según gramática Y/O:
        # "Y" en fila i → fila i se agrupa AND con fila i+1
        # (y sucesivas si también son "Y"). "O" y "" son OR independientes.
        sub_grupos: List[List[dict]] = []
        i = 0
        while i < len(grupo):
            yo = (grupo[i].get("operador_logico") or "").strip().upper()
            if yo == "Y":
                # Inicia sub-grupo AND: consume esta y siguientes hasta que
                # la próxima no sea "Y" (esa última también se incluye)
                and_group: List[dict] = [grupo[i]]
                i += 1
                while i < len(grupo):
                    and_group.append(grupo[i])
                    siguiente_yo = (grupo[i].get("operador_logico") or "").strip().upper()
                    i += 1
                    if siguiente_yo != "Y":
                        break
                sub_grupos.append(and_group)
            else:
                # "O" o "" → alternativa OR independiente
                sub_grupos.append([grupo[i]])
                i += 1

        if not sub_grupos:
            sub_grupos = [[r] for r in grupo]

        # Válido si AL MENOS UN sub-grupo AND pasa completamente
        algun_subgrupo_valido = False
        for sub in sub_grupos:
            if all(_evaluar_regla(r, reporte_dict, mapa_fechas, VAR_MAP) for r in sub):
                algun_subgrupo_valido = True
                break

        if not algun_subgrupo_valido:
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
    campo = regla.get("campo")
    if not campo:
        return
    val = _get_valor(reporte_dict, campo)
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

        # Para condiciones, NO hacer bypass de centinelas en rangos:
        # "fecha_dukes > 1846-01-01" debe ser False si fecha_dukes=1845-01-01
        if not _comparar(val_cond, cond_op, cond_val_r, bypass_centinela=False):
            return True  # condición no se cumple → restricción no aplica

    # ── Evaluar restricción ────────────────────────────────────────────────
    val_campo = _get_valor(reporte_dict, campo)
    if val_campo is None:
        return True  # campo ausente → no se puede validar

    op_rest   = restriccion.get("operador", "=")
    val_rest  = restriccion.get("valor", "")
    val_rest_r = _resolver_variable(val_rest, reporte_dict, var_map)

    # Si val_rest era una referencia V-number pero el campo referenciado
    # no tiene valor en el reporte (ej: V134 cuando fecha_bdua es vacío),
    # no se puede validar la restricción → omitir (True = sin error)
    if val_rest_r is None and val_rest != val_rest_r:
        return True

    val_rest_r = _traducir_fecha(val_rest_r or val_rest, mapa_fechas)

    return _comparar(val_campo, op_rest, val_rest_r)
