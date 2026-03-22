# app/schemas/common.py
from pydantic import BaseModel
from typing import Optional, List

FECHAS_ESPECIALES = {"1800-01-01", "1845-01-01", "1846-01-01", "1840-01-01"}


class ErrorDetalle(BaseModel):
    id_regla: str
    campo: Optional[str] = None
    nivel: str = "ERROR"   # ERROR | ADVERTENCIA
    mensaje: str
    variable_res: Optional[str] = None  # Trazabilidad: "V18", "V29", etc.


class ValidationResponse(BaseModel):
    valido: bool
    total_errores: int = 0
    total_advertencias: int = 0
    total_levantadas: int = 0
    errores_por_campo: dict = {}
    errores_generales: List[ErrorDetalle] = []
    resumen_por_seccion: dict = {}
