# app/schemas/paliativos.py
from pydantic import BaseModel
from typing import Optional


class CuidadosPaliativos(BaseModel):
    # V114
    valorado: str = "2"
    # V114.1-V114.6 - 1=Sí, 2=No, 55
    por_medico_especialista: Optional[str] = None
    por_profesional_no_medico: Optional[str] = None
    por_medico_otra_especialidad: Optional[str] = None
    por_medico_general: Optional[str] = None
    por_trabajo_social: Optional[str] = None
    por_otro_profesional: Optional[str] = None
    # V115
    fecha_primera_atencion: Optional[str] = None
    # V116
    ips_paliativo: Optional[str] = None


class Soporte(BaseModel):
    # V117 - 1=Sí, 2=No pendiente, 98=No ordenado, 55
    psiquiatria: str = "98"
    # V118
    fecha_psiquiatria: Optional[str] = None
    # V119
    ips_psiquiatria: Optional[str] = None
    # V120 - 1=Sí, 2=pendiente, 98, 55
    nutricion: str = "98"
    # V121
    fecha_nutricion: Optional[str] = None
    # V122
    ips_nutricion: Optional[str] = None
    # V123_soporte - 1=enteral, 2=parenteral, 3=ambas, 4=No, 55
    soporte_nutricional: Optional[str] = None
    # V124_terapias - 1=Terapia física,2=lenguaje,3=ocupacional,4=pendiente,5-8=combos,98,55
    terapias_complementarias: Optional[str] = None


# app/schemas/resultado.py  (se incluye aquí por comodidad)
class ResultadoNovedades(BaseModel):
    # V123
    tipo_tratamiento_corte: str
    # V124 - 1-8, 55, 97, 98, 99
    resultado_oncologico: str
    # V125 - 1=Vivo, 2=Fallecido, 55, 99
    estado_vital: str
    # V126 - 0-19
    novedad_administrativa: str
    # V127 - 1,3,8-12, 55
    novedad_clinica: str
    # V128
    fecha_desafiliacion: Optional[str] = None
    # V129
    fecha_muerte: Optional[str] = None
    # V130 - 1-4, 55, 98
    causa_muerte: Optional[str] = None
    # V131
    codigo_bdua: Optional[str] = None
    # V134 - debe ser 2024-01-01
    fecha_bdua: str = "2024-01-01"
