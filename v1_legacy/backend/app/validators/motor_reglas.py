# app/validators/motor_reglas.py
"""
Motor de reglas CAC — Versión corregida.
========================================
Cambios respecto a la versión anterior (v1_legacy):

  FIX-01  Agrupamiento Y/O corregido: agrupa por (id, campo) en lugar de
          solo (id). Evitaba que reglas de distintas variables con el mismo
          código de error se mezclaran en un único grupo OR/AND.

  FIX-02  Integración con expansion.py: antes de evaluar reglas, se calculan
          los campos activos del registro. Campos fuera de ese conjunto se
          omiten → elimina falsos positivos en V53.x / V66.x / V46.x / V114.x.

  FIX-03  Campos malformados resueltos: las 4 reglas DEFINICION con paths
          "V1.0", "V2.0", "V3.0", "V12.0" ahora se resuelven correctamente
          contra VAR_MAP antes de escribir reglas.json.

  FIX-04  V113 → cuidados_paliativos.valorado correctamente mapeado,
          activando V114.1–V114.6 cuando corresponde.

  FIX-05  _resolver_variable ahora soporta None limpiamente sin crash
          cuando el valor de referencia es una fecha centinela.

FECHAS DINÁMICAS (relativas a la fecha de corte V134)
======================================================
El Excel base es cohorte 2023 → corte 2024-01-01.
El motor traduce en tiempo real para cualquier cohorte futura.

  Excel base   │ Fórmula           │ Ejemplo 2026→2027
  ─────────────┼───────────────────┼─────────────────────
  2024-01-01   │ fecha_corte       │ 2027-01-01
  2023-01-01   │ fecha_corte − 1a  │ 2026-01-01
  2023-01-02   │ fecha_corte −1a+1d│ 2026-01-02  ← inicio
  2023-11-01   │ fecha_corte − 2m  │ 2026-11-01
  2021-01-01   │ fecha_corte − 3a  │ 2024-01-01
  2021-01-02   │ fecha_corte −3a+1d│ 2024-01-02
  2017-01-01   │ fecha_corte − 7a  │ 2020-01-01
  2005-01-01   │ fecha_corte − 19a │ 2008-01-01
  2004-01-01   │ fecha_corte − 20a │ 2007-01-01

Fechas FIJAS (nunca se traducen):
  1800-01-01  → Comodín: Desconocido
  1840-01-01  → Comodín: No aplica (mama in situ)
  1845-01-01  → Comodín: No aplica
  1846-01-01  → Comodín: PPNA / ente territorial
  1900-01-01  → Límite inferior fecha nacimiento
  1993-01-01  → Creación del SGSSS Colombia
"""

import json
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set

from dateutil.relativedelta import relativedelta

from app.schemas.common import ErrorDetalle, FECHAS_ESPECIALES
from app.validators.expansion import expandir_campos_activos, diagnosticar_grupos

# ── Rutas y caché ─────────────────────────────────────────────────────────
_REGLAS_PATH = Path(__file__).parent.parent / "reglas.json"
_REGLAS_CACHE: Optional[List[dict]] = None

# Cohorte base del Excel (2023 → corte 2024-01-01)
_COHORTE_BASE = date(2024, 1, 1)

# Fechas que NUNCA se traducen — comodines semánticos y límites del SGSSS
_FECHAS_FIJAS = {
    "1800-01-01",
    "1840-01-01",
    "1845-01-01",
    "1846-01-01",
    "1900-01-01",
    "1993-01-01",
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
    """Fuerza recarga del caché tras regenerar reglas.json."""
    global _REGLAS_CACHE
    _REGLAS_CACHE = None


# ─── Calendario dinámico de la cohorte ───────────────────────────────────

def _fechas_cohorte(fecha_corte: date, fecha_inicio: Optional[date] = None) -> Dict[str, str]:
    """
    Construye el mapa {fecha_excel_base → fecha_real} para la cohorte activa.
    fecha_inicio: si None, se calcula como fecha_corte − 1 año + 1 día.
    """
    fc   = fecha_corte
    base = _COHORTE_BASE

    def fmt(d: date) -> str:
        return d.strftime("%Y-%m-%d")

    fi = fecha_inicio if fecha_inicio else (fc - relativedelta(years=1) + timedelta(days=1))

    return {
        fmt(base):                                                  fmt(fc),
        fmt(base - relativedelta(years=1)):                         fmt(fc - relativedelta(years=1)),
        fmt(base - relativedelta(years=1) + timedelta(days=1)):     fmt(fi),
        fmt(base - relativedelta(months=2)):                        fmt(fc - relativedelta(months=2)),
        fmt(base - relativedelta(years=3)):                         fmt(fc - relativedelta(years=3)),
        fmt(base - relativedelta(years=3) + timedelta(days=1)):     fmt(fc - relativedelta(years=3) + timedelta(days=1)),
        fmt(base - relativedelta(years=7)):                         fmt(fc - relativedelta(years=7)),
        fmt(base - relativedelta(years=19)):                        fmt(fc - relativedelta(years=19)),
        fmt(base - relativedelta(years=20)):                        fmt(fc - relativedelta(years=20)),
    }


def _traducir_fecha(valor: str, mapa: Dict[str, str]) -> str:
    if not valor or valor in _FECHAS_FIJAS:
        return valor
    return mapa.get(valor, valor)


# ─── Utilidades de acceso ────────────────────────────────────────────────

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
    Si val es una referencia 'V{n}', la resuelve contra el reporte.
    Si no es referencia, la devuelve tal cual.
    Retorna None si la referencia existe pero el campo está vacío.
    """
    if not val:
        return val
    m = re.match(r"(V\d+(?:\.\d+)?)", val)
    if m:
        path = var_map.get(m.group(1))
        if path:
            return _get_valor(reporte_dict, path)
        return None  # referencia reconocida pero sin path → omitir
    return val


def _es_fecha(valor: str) -> bool:
    try:
        datetime.strptime(valor, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


# ─── Comparación ────────────────────────────────────────────────────────

def _comparar(
    val_campo: Optional[str],
    operador: str,
    val_regla: Optional[str],
    bypass_centinela: bool = True,
) -> bool:
    """
    Compara val_campo {operador} val_regla.

    bypass_centinela=True (para RESTRICCIONES):
      Si algún operando es fecha centinela y el operador es de rango, retorna True.

    bypass_centinela=False (para CONDICIONES):
      Las fechas centinela se comparan normalmente. Permite que condiciones
      como 'fecha_dukes > 1846-01-01' evalúen False si fecha_dukes=1845-01-01.

    Si algún valor es None, retorna True (campo ausente → regla no aplica).
    """
    if val_campo is None or val_regla is None:
        return True

    if bypass_centinela:
        if val_campo in FECHAS_ESPECIALES and operador in ("<", ">", "<=", ">="):
            return True
        if val_regla in FECHAS_ESPECIALES and operador in ("<", ">", "<=", ">="):
            return True

    # Comparación de fechas
    if _es_fecha(val_campo) and _es_fecha(val_regla):
        a = datetime.strptime(val_campo, "%Y-%m-%d")
        b = datetime.strptime(val_regla, "%Y-%m-%d")
        return _cmp(a, operador, b)

    # Comparación numérica
    try:
        return _cmp(float(val_campo), operador, float(val_regla))
    except (ValueError, TypeError):
        pass

    # Comparación de strings (case-insensitive)
    return _cmp(val_campo.upper().strip(), operador, val_regla.upper().strip())


def _cmp(a, op: str, b) -> bool:
    ops = {
        "=": a == b, "!=": a != b, "<>": a != b,
        "<=": a <= b, ">=": a >= b,
        "<": a < b,   ">": a > b,
    }
    return ops.get(op.strip(), True)


# ─── Evaluación de una regla individual ─────────────────────────────────

def _evaluar_regla(
    regla: dict,
    reporte_dict: dict,
    mapa_fechas: Dict[str, str],
    var_map: dict,
) -> bool:
    """
    Evalúa una regla CONDICIONAL o SIMPLE.
    Retorna True si se cumple (sin error), False si hay infracción.
    """
    campo       = regla.get("campo")
    restriccion = regla.get("restriccion") or {}
    condicion   = regla.get("condicion")

    if not campo:
        return True

    # ── Evaluar condición (si existe) ────────────────────────────────────
    if condicion:
        cond_campo = condicion.get("campo")
        cond_op    = condicion.get("operador", "=")
        cond_val   = condicion.get("valor", "")

        val_cond = _get_valor(reporte_dict, cond_campo)
        if val_cond is None:
            return True  # campo condición ausente → regla no aplica

        cond_val_r = _resolver_variable(cond_val, reporte_dict, var_map)
        cond_val_r = _traducir_fecha(cond_val_r or cond_val, mapa_fechas)

        # Para condiciones NO se hace bypass de centinelas (comportamiento correcto)
        if not _comparar(val_cond, cond_op, cond_val_r, bypass_centinela=False):
            return True  # condición no aplica → restricción no evaluada

    # ── Evaluar restricción ──────────────────────────────────────────────
    val_campo = _get_valor(reporte_dict, campo)
    if val_campo is None:
        return True  # campo ausente → no se puede validar

    op_rest   = restriccion.get("operador", "=")
    val_rest  = restriccion.get("valor", "")
    val_rest_r = _resolver_variable(val_rest, reporte_dict, var_map)

    # Si val_rest era referencia V-number pero el campo referenciado está vacío → omitir
    if val_rest_r is None and val_rest != val_rest_r:
        return True

    val_rest_r = _traducir_fecha(val_rest_r or val_rest, mapa_fechas)
    return _comparar(val_campo, op_rest, val_rest_r)


def _evaluar_definicion(
    regla: dict,
    reporte_dict: dict,
    errores: List[ErrorDetalle],
) -> None:
    """Valida reglas de tipo DEFINICION (formato/existencia del campo)."""
    campo   = regla.get("campo")
    mensaje = regla.get("mensaje") or regla.get("descripcion_original", "")
    var_res = regla.get("variable", "")

    if not campo:
        return

    valor = _get_valor(reporte_dict, campo)
    if valor is None or valor.strip() == "":
        errores.append(ErrorDetalle(
            id_regla=regla.get("id", ""),
            campo=campo,
            nivel="ERROR",
            mensaje=f"[DEFINICIÓN] Campo obligatorio vacío o ausente: {campo}. {mensaje}",
            variable_res=str(var_res),
        ))


# ─── Motor principal ─────────────────────────────────────────────────────

def ejecutar_motor(reporte_dict: dict) -> List[ErrorDetalle]:
    """
    Ejecuta las 4 fases del motor CAC sobre el reporte.

    Fase 1 — Carga de reglas y contexto de cohorte.
    Fase 2 — Expansión estructural: determina campos activos (grupos dinámicos).
    Fase 3 — Evaluación de reglas con lógica Y/O corregida.
    Fase 4 — Retorno de errores con metadata.
    """
    from scripts.generar_catalogos import VAR_MAP
    from app.config_cohorte import resolver_fecha_corte, resolver_fecha_inicio

    reglas    = _cargar_reglas()
    errores: List[ErrorDetalle] = []

    # ── FASE 1: Resolver fecha de corte y construir mapa de fechas ────────
    fecha_corte_str = _get_valor(reporte_dict, "resultado.fecha_bdua")
    if not fecha_corte_str:
        fecha_corte_str = _get_valor(reporte_dict, "cabecera.fecha_corte")

    # Inyectar en resultado.fecha_bdua para que V134 se resuelva siempre
    if fecha_corte_str and not _get_valor(reporte_dict, "resultado.fecha_bdua"):
        reporte_dict.setdefault("resultado", {})["fecha_bdua"] = fecha_corte_str

    mapa_fechas: Dict[str, str] = {}
    fc = resolver_fecha_corte(fecha_corte_str)
    if fc:
        fi = resolver_fecha_inicio(fc)
        mapa_fechas = _fechas_cohorte(fc, fi)

    # ── FASE 2: Expansión estructural — campos activos de grupos dinámicos ─
    campos_activos: Set[str] = expandir_campos_activos(reporte_dict)

    # ── FASE 3: Agrupar reglas por (id, campo) y evaluar con Y/O ─────────
    #
    # GRAMÁTICA Y/O del Excel CAC:
    #   "Y"  → esta fila se agrupa AND con la siguiente
    #   "O"  → alternativa OR independiente
    #   ""   → última fila del grupo, alternativa OR independiente
    #
    # Evaluación final: OR de sub-grupos AND.
    # Error solo si NINGÚN sub-grupo AND pasa completamente.
    #
    # FIX-01: La clave es (id, campo) — no solo id — para evitar mezclar
    # reglas de distintas variables que comparten código de error.

    grupos: Dict[tuple, List[dict]] = {}
    for r in reglas:
        if not r.get("activa", True):
            continue

        tipo = r.get("tipo_regla", "")

        if tipo == "DEFINICION":
            _evaluar_definicion(r, reporte_dict, errores)
            continue

        if tipo not in ("CONDICIONAL", "SIMPLE"):
            continue

        # FIX-02: omitir campos de grupos dinámicos que no aplican
        campo_r = r.get("campo", "")
        es_dinamico = any(
            campo_r.startswith(prefijo) for prefijo in [
                "terapia_sistemica.primer_esquema.med",
                "terapia_sistemica.ultimo_esquema.med",
                "terapia_sistemica.fases.",
                "cuidados_paliativos.med_",
                "cuidados_paliativos.prof_",
                "cuidados_paliativos.trabajo_social",
                "cuidados_paliativos.otro_prof",
            ]
        )
        if es_dinamico and campo_r not in campos_activos:
            continue  # campo no activo para este registro → skip

        # FIX-01: clave compuesta (id, campo)
        clave = (r.get("id", ""), campo_r)
        grupos.setdefault(clave, []).append(r)

    # ── Evaluar cada grupo de reglas ──────────────────────────────────────
    for (id_regla, campo_grupo), grupo in grupos.items():
        # Partir el grupo en sub-grupos AND según el marcador Y/O
        sub_grupos_and = []
        actual = []
        for regla in grupo:
            actual.append(regla)
            yo = str(regla.get("operador_logico", "")).strip().upper()
            if yo != "Y":
                sub_grupos_and.append(actual)
                actual = []
        if actual:
            sub_grupos_and.append(actual)

        # OR de sub-grupos AND: error si NINGUNO pasa
        alguno_pasa = False
        for sub in sub_grupos_and:
            pasa_todo = all(
                _evaluar_regla(r, reporte_dict, mapa_fechas, VAR_MAP)
                for r in sub
            )
            if pasa_todo:
                alguno_pasa = True
                break

        if not alguno_pasa and sub_grupos_and:
            regla_ref = sub_grupos_and[0][0]
            errores.append(ErrorDetalle(
                id_regla=id_regla,
                campo=campo_grupo,
                nivel=regla_ref.get("nivel", "ERROR"),
                mensaje=regla_ref.get("mensaje", regla_ref.get("descripcion_original", "")),
                variable_res=str(regla_ref.get("variable", "")),
            ))

    return errores


def ejecutar_motor_con_diagnostico(reporte_dict: dict) -> dict:
    """
    Versión extendida de ejecutar_motor que incluye diagnóstico de grupos dinámicos.
    Útil en desarrollo y para el endpoint /api/validar-cac/debug.
    """
    errores = ejecutar_motor(reporte_dict)
    grupos_info = diagnosticar_grupos(reporte_dict)
    return {
        "errores": [e.dict() for e in errores],
        "total_errores": len(errores),
        "grupos_dinamicos": grupos_info,
    }
