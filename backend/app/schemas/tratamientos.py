# app/schemas/tratamientos.py
from pydantic import BaseModel
from typing import Optional, List


class EsquemaQt(BaseModel):
    ubicacion_temporal: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    num_ips: Optional[str] = None
    ips1: Optional[str] = None
    ips2: Optional[str] = None
    num_medicamentos: Optional[str] = None
    medicamentos: List[str] = []          # códigos ATC
    medicamentos_extra: List[str] = []    # hasta 3 adicionales
    qt_intratecal: Optional[str] = None   # 1=Sí, 2=No, 98
    caracteristicas: Optional[str] = None  # 1=completo,2=incompleto,3=en curso,98,55
    motivo_finalizacion: Optional[str] = None


class TratamientoSistemico(BaseModel):
    # V45 - 1=Sí, 55, 98
    recibio_qt: str = "98"
    # V46
    num_fases: Optional[str] = None
    # V46.1-46.8 - fases para hematolinfáticos
    fase_prefase: Optional[str] = None
    fase_induccion: Optional[str] = None
    fase_intensificacion: Optional[str] = None
    fase_consolidacion: Optional[str] = None
    fase_reinduccion: Optional[str] = None
    fase_mantenimiento: Optional[str] = None
    fase_mantenimiento_largo: Optional[str] = None
    fase_otra: Optional[str] = None
    # V47
    num_ciclos: Optional[str] = None
    # Primer esquema (V48–V60)
    primer_esquema: Optional[EsquemaQt] = None
    # Último esquema (V61–V73) - None si solo hay uno
    ultimo_esquema: Optional[EsquemaQt] = None
