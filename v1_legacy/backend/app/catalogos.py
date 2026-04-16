# app/catalogos.py
"""
Carga los catálogos extraídos del Excel oficial
'Reglas Validación Cáncer 2023 V01.xlsx'.
El archivo catalogos_excel.json se genera con:
  python scripts/generar_catalogos.py <ruta_excel>
"""
import json
import os
from pathlib import Path

_BASE = Path(__file__).parent
_JSON = _BASE / "catalogos_excel.json"


def _cargar() -> dict:
    if _JSON.exists():
        with open(_JSON, encoding="utf-8") as f:
            return json.load(f)
    # Fallback mínimo si no existe el JSON
    return {
        "cie10_validos": [],
        "cie10_solo_femenino": [
            "C510","C511","C512","C518","C519","C52X",
            "C530","C531","C538","C539","C540","C541","C542","C543","C548","C549",
            "C55X","C56X","C570","C571","C572","C573","C574","C577","C578","C579","C58X",
            "D060","D061","D067","D069","D070","D071","D072","D073",
        ],
        "cie10_solo_masculino": [
            "C600","C601","C602","C608","C609","C61X",
            "C620","C621","C629","C630","C631","C632","C637","C638","C639",
            "D074","D075","D076",
        ],
        "cups_validos": [],
        "atc_validos": [],
    }


_DATA = _cargar()

CIE10_VALIDOS: set       = set(_DATA.get("cie10_validos", []))
CIE10_SOLO_F: set        = set(_DATA.get("cie10_solo_femenino", []))
CIE10_SOLO_M: set        = set(_DATA.get("cie10_solo_masculino", []))
CUPS_VALIDOS: set        = set(_DATA.get("cups_validos", []))
ATC_VALIDOS: set         = set(_DATA.get("atc_validos", []))


def recargar_desde_excel(ruta_excel: str) -> dict:
    """
    Recarga los catálogos en memoria desde el catalogos_excel.json
    (que ya fue regenerado por generar_desde_excel antes de llamar esto).
    El parámetro ruta_excel se mantiene por compatibilidad pero ya no se usa.
    """
    global CIE10_VALIDOS, CIE10_SOLO_F, CIE10_SOLO_M, CUPS_VALIDOS, ATC_VALIDOS

    datos = _cargar()  # lee el JSON recién escrito en disco

    CIE10_VALIDOS = set(datos.get("cie10_validos", []))
    CIE10_SOLO_F  = set(datos.get("cie10_solo_femenino", []))
    CIE10_SOLO_M  = set(datos.get("cie10_solo_masculino", []))
    CUPS_VALIDOS  = set(datos.get("cups_validos", []))
    ATC_VALIDOS   = set(datos.get("atc_validos", []))

    return {
        "cie10_validos":       len(CIE10_VALIDOS),
        "cie10_solo_femenino": len(CIE10_SOLO_F),
        "cie10_solo_masculino": len(CIE10_SOLO_M),
        "cups_validos":        len(CUPS_VALIDOS),
        "atc_validos":         len(ATC_VALIDOS),
    }
