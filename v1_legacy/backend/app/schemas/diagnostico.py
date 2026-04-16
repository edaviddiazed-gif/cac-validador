# app/schemas/diagnostico.py
from pydantic import BaseModel
from typing import Optional


class Diagnostico(BaseModel):
    # V17
    cie10_neoplasia_primaria: str
    # V18
    fecha_diagnostico: str
    # V19
    fecha_remision: Optional[str] = None
    # V20
    fecha_ingreso_ips: Optional[str] = None
    # V21 - 5=Inmunohistoquímica,6=Citometría,7=Clínica,8=Otro,9=Genética,10=Patología básica,55,99
    tipo_estudio_diagnostico: str
    # V22 - aplica si V21=7
    motivo_sin_histopatologia: Optional[str] = None
    # V23
    fecha_recoleccion_muestra: Optional[str] = None
    # V24
    fecha_informe_histopatologico: Optional[str] = None
    # V25
    codigo_ips_confirmadora: Optional[str] = None
    # V26
    fecha_primera_consulta_tratante: Optional[str] = None
    # V27 - 1-24, 55, 98, 99
    histologia: Optional[str] = None
    # V28 - 1-4, 55, 94, 95, 98, 99
    grado_diferenciacion: Optional[str] = None
    # V29
    estadificacion_tnm: Optional[str] = None
    # V30
    fecha_estadificacion_tnm: Optional[str] = None
    # V31 - 1=Sí, 2=No, 55, 97, 98, 99
    her2_realizado: Optional[str] = None
    # V32
    fecha_her2: Optional[str] = None
    # V33 - 1=+++, 2=++, 3=+, 4=cero, 55, 97, 98, 99
    resultado_her2: Optional[str] = None
    # V34 - 1=A,2=B,3=C,4=D, 55, 98, 99
    estadificacion_dukes: Optional[str] = None
    # V35
    fecha_dukes: Optional[str] = None
    # V36
    ann_arbor_lugano: Optional[str] = None
    # V37 - 11-15, 55, 97, 98, 99
    gleason: Optional[str] = None
    # V38 - 1-5, 55, 98, 99
    clasificacion_riesgo: Optional[str] = None
    # V39
    fecha_clasificacion_riesgo: Optional[str] = None
    # V40 - 1=Curación, 2=Paliación, 55, 99
    objetivo_inicial: str
    # V41 - 1-6, 55, 99
    objetivo_periodo: str
    # V42 - 1=Sí, 2=No, 55, 99
    antecedente_otro_cancer: str
    # V43
    fecha_otro_cancer: Optional[str] = None
    # V44
    cie10_otro_cancer: Optional[str] = None
