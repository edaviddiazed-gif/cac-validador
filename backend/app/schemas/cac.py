# app/schemas/cac.py
from pydantic import BaseModel
from .paciente import Paciente
from .diagnostico import Diagnostico
from .tratamientos import TratamientoSistemico
from .procedimientos import Cirugia, Radioterapia, Trasplante, CirugiaReconstructiva
from .paliativos import CuidadosPaliativos, Soporte, ResultadoNovedades


class Cabecera(BaseModel):
    id_reporte: str
    fecha_corte: str
    fuente: str = "EAPB"


class CACReport(BaseModel):
    cabecera: Cabecera
    paciente: Paciente
    diagnostico: Diagnostico
    terapia_sistemica: TratamientoSistemico
    cirugia: Cirugia
    radioterapia: Radioterapia
    trasplante: Trasplante
    cirugia_reconstructiva: CirugiaReconstructiva
    cuidados_paliativos: CuidadosPaliativos
    soporte: Soporte
    resultado: ResultadoNovedades
