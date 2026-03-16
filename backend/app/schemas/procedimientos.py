# app/schemas/procedimientos.py
from pydantic import BaseModel
from typing import Optional, List


class Cirugia(BaseModel):
    # V74
    recibio_cirugia: str = "2"
    # V75
    num_cirugias: Optional[str] = None
    # Primera cirugía V76-V81
    fecha_primera: Optional[str] = None
    ips_primera: Optional[str] = None
    cups_primera: Optional[str] = None
    ubicacion_primera: Optional[str] = None
    # Última cirugía V82-V86 (si num>1)
    fecha_ultima: Optional[str] = None
    motivo_ultima: Optional[str] = None
    ips_ultima: Optional[str] = None
    cups_ultima: Optional[str] = None
    ubicacion_ultima: Optional[str] = None
    # V86
    estado_vital_post_cirugia: Optional[str] = None


class EsquemaRt(BaseModel):
    fecha_inicio: Optional[str] = None
    ubicacion_temporal: Optional[str] = None
    tipo_rt: Optional[str] = None        # CUPS
    num_ips: Optional[str] = None
    ips1: Optional[str] = None
    ips2: Optional[str] = None
    fecha_fin: Optional[str] = None
    caracteristicas: Optional[str] = None
    motivo_finalizacion: Optional[str] = None


class Radioterapia(BaseModel):
    # V87
    recibio_rt: str = "98"
    # V88
    num_sesiones: Optional[str] = None
    # Primer esquema RT V89–V97
    primer_esquema: Optional[EsquemaRt] = None
    # Último esquema RT V98–V105
    ultimo_esquema: Optional[EsquemaRt] = None


class Trasplante(BaseModel):
    # V106
    recibio_trasplante: str = "98"
    # V107
    tipo_trasplante: Optional[str] = None
    # V108
    ubicacion_trasplante: Optional[str] = None
    # V109
    fecha_trasplante: Optional[str] = None
    # V110
    ips_trasplante: Optional[str] = None


class CirugiaReconstructiva(BaseModel):
    # V111
    recibio_cx_rec: str = "98"
    # V112
    fecha_cx_rec: Optional[str] = None
    # V113
    ips_cx_rec: Optional[str] = None
