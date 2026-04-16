# app/schemas/paciente.py
from pydantic import BaseModel, field_validator
from typing import Optional


TIPOS_ID_VALIDOS = {"RC", "TI", "CC", "CE", "PA", "MS", "AS", "CD", "SD", "PE"}
REGIMENES_VALIDOS = {"C", "S", "P", "E", "N"}
SEXOS_VALIDOS = {"M", "F"}


class Paciente(BaseModel):
    # V1
    primer_nombre: str
    # V2
    segundo_nombre: Optional[str] = None
    # V3
    primer_apellido: str
    # V4
    segundo_apellido: Optional[str] = None
    # V5
    tipo_id: str
    # V6
    numero_id: str
    # V7
    fecha_nacimiento: str
    # V8
    sexo: str
    # V9
    ocupacion: Optional[str] = None
    # V10
    regimen_afiliacion: str
    # V11
    codigo_eps: str
    # V12
    pertenencia_etnica: str
    # V13
    grupo_poblacional: str
    # V14
    municipio_residencia: str
    # V15
    telefono: Optional[str] = "0"
    # V16
    fecha_afiliacion: str

    @field_validator("tipo_id")
    @classmethod
    def validar_tipo_id(cls, v: str) -> str:
        if v.upper() not in TIPOS_ID_VALIDOS:
            raise ValueError(f"Tipo de identificación inválido. Use: {', '.join(sorted(TIPOS_ID_VALIDOS))}")
        return v.upper()

    @field_validator("sexo")
    @classmethod
    def validar_sexo(cls, v: str) -> str:
        if v.upper() not in SEXOS_VALIDOS:
            raise ValueError("Sexo inválido. Use M (masculino) o F (femenino).")
        return v.upper()

    @field_validator("municipio_residencia")
    @classmethod
    def validar_municipio(cls, v: str) -> str:
        if v not in {"55", "555"} and (not v.isdigit() or len(v) != 5):
            raise ValueError("El código DIVIPOLA del municipio debe tener exactamente 5 dígitos.")
        return v
