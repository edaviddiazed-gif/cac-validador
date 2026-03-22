# app/config_cohorte.py
"""
Configuración del período de reporte (cohorte) del validador CAC.

Por defecto, el motor infiere las fechas dinámicas a partir de V134
(fecha de corte del propio reporte). Este módulo permite al administrador
fijar explícitamente:
  - fecha_corte:  último día del período (normalmente 01-01 del año de reporte)
  - fecha_inicio: primer día del período (normalmente 02-02 del año anterior)

Si NO se configura manualmente, el motor sigue usando V134 del reporte
como fecha de corte (comportamiento original). La fecha de inicio se
calcula automáticamente como fecha_corte − 1 año + 1 día cuando no
se especifica.

Ejemplo cohorte 2026→2027:
  fecha_corte:  2027-01-01
  fecha_inicio: 2026-02-02  (o la fecha que defina el admin)
"""

import json
import os
from datetime import date, timedelta
from pathlib import Path
from typing import Optional
from dateutil.relativedelta import relativedelta

_CONFIG_PATH = Path(__file__).parent / "cohorte.json"

# Estructura por defecto: sin configuración manual (usa V134)
_DEFAULTS: dict = {
    "fecha_corte":  None,   # str "YYYY-MM-DD" o null
    "fecha_inicio": None,   # str "YYYY-MM-DD" o null
    "descripcion":  "Cohorte automática (usa V134 del reporte)",
}


def _leer() -> dict:
    if _CONFIG_PATH.exists():
        try:
            return json.loads(_CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return _DEFAULTS.copy()


def _escribir(cfg: dict) -> None:
    _CONFIG_PATH.write_text(
        json.dumps(cfg, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_cohorte() -> dict:
    """
    Devuelve la configuración activa de la cohorte.
    Siempre incluye 'fecha_corte' y 'fecha_inicio' calculadas
    (nunca None salvo que no haya configuración manual).
    """
    cfg = _leer()
    return {
        "fecha_corte":  cfg.get("fecha_corte"),
        "fecha_inicio": cfg.get("fecha_inicio"),
        "descripcion":  cfg.get("descripcion", ""),
        "modo":         "manual" if cfg.get("fecha_corte") else "automatico",
    }


def set_cohorte(
    fecha_corte: str,
    fecha_inicio: Optional[str] = None,
    descripcion: Optional[str] = None,
) -> dict:
    """
    Fija la cohorte manualmente.
    - fecha_corte:  obligatoria, formato YYYY-MM-DD
    - fecha_inicio: opcional. Si no se pasa, se calcula como
                    fecha_corte − 1 año + 1 día (ej: 2027-01-01 → 2026-01-02).
                    El usuario puede pasar cualquier fecha de inicio que necesite
                    (ej: 2026-02-02 si el período comenzó en febrero).
    """
    from datetime import datetime
    # Validar formato
    try:
        fc = datetime.strptime(fecha_corte, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"fecha_corte '{fecha_corte}' no tiene formato YYYY-MM-DD")

    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError(f"fecha_inicio '{fecha_inicio}' no tiene formato YYYY-MM-DD")
        if fi >= fc:
            raise ValueError("fecha_inicio debe ser anterior a fecha_corte")
        fi_str = fecha_inicio
    else:
        # Calcular automáticamente: fecha_corte - 1 año + 1 día
        fi_auto = fc - relativedelta(years=1) + timedelta(days=1)
        fi_str = fi_auto.strftime("%Y-%m-%d")

    cfg = {
        "fecha_corte":  fecha_corte,
        "fecha_inicio": fi_str,
        "descripcion":  descripcion or f"Cohorte {fi_str} → {fecha_corte}",
    }
    _escribir(cfg)
    return get_cohorte()


def reset_cohorte() -> dict:
    """Vuelve al modo automático (V134 del reporte)."""
    if _CONFIG_PATH.exists():
        _CONFIG_PATH.unlink()
    return get_cohorte()


def resolver_fecha_corte(fecha_corte_reporte: Optional[str]) -> Optional[date]:
    """
    Devuelve la fecha de corte efectiva:
    1. Si hay configuración manual → usa esa.
    2. Si no → usa V134 del reporte.
    """
    from datetime import datetime
    cfg = _leer()
    fc_str = cfg.get("fecha_corte") or fecha_corte_reporte
    if not fc_str:
        return None
    try:
        return datetime.strptime(fc_str, "%Y-%m-%d").date()
    except ValueError:
        return None


def resolver_fecha_inicio(fecha_corte: date) -> date:
    """
    Devuelve la fecha de inicio del período:
    1. Si hay configuración manual → usa esa.
    2. Si no → fecha_corte − 1 año + 1 día.
    """
    from datetime import datetime
    cfg = _leer()
    fi_str = cfg.get("fecha_inicio")
    if fi_str:
        try:
            return datetime.strptime(fi_str, "%Y-%m-%d").date()
        except ValueError:
            pass
    return fecha_corte - relativedelta(years=1) + timedelta(days=1)
