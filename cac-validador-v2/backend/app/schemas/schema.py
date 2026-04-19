"""
schema.py — Modelos Pydantic para la API CAC-Validador v2
==========================================================
Define la estructura de entrada (ReporteCAC) y salida (ResultadoValidacion).
"""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ─── Sub-modelos de entrada ────────────────────────────────────────────────

class Cabecera(BaseModel):
    fecha_corte: Optional[str] = None
    entidad_responsable: Optional[str] = None

class Paciente(BaseModel):
    tipo_id: Optional[str] = None
    num_id: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    primer_nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    municipio_residencia: Optional[str] = None
    departamento_residencia: Optional[str] = None
    pais_residencia: Optional[str] = None
    eps: Optional[str] = None
    regimen: Optional[str] = None
    tipo_afiliado: Optional[str] = None
    pertenencia_etnica: Optional[str] = None
    discapacidad: Optional[str] = None

class Diagnostico(BaseModel):
    cie10_neoplasia_primaria: Optional[str] = None
    fecha_diagnostico: Optional[str] = None
    estadificacion_clinica: Optional[str] = None
    morfologia: Optional[str] = None
    topografia: Optional[str] = None
    lateralidad: Optional[str] = None
    fuente_diagnostico: Optional[str] = None
    fecha_confirmacion: Optional[str] = None
    institucion_diagnostico: Optional[str] = None

class MedicamentoEsquema(BaseModel):
    nombre: Optional[str] = None
    dosis: Optional[str] = None
    unidad: Optional[str] = None
    via: Optional[str] = None
    frecuencia: Optional[str] = None

class EsquemaQT(BaseModel):
    num_medicamentos: Optional[str] = None
    med1: Optional[MedicamentoEsquema] = None
    med2: Optional[MedicamentoEsquema] = None
    med3: Optional[MedicamentoEsquema] = None
    med4: Optional[MedicamentoEsquema] = None
    med5: Optional[MedicamentoEsquema] = None
    med6: Optional[MedicamentoEsquema] = None
    med7: Optional[MedicamentoEsquema] = None
    med8: Optional[MedicamentoEsquema] = None
    med9: Optional[MedicamentoEsquema] = None

class TerapiaSistemica(BaseModel):
    recibio_qt: Optional[str] = None
    num_fases: Optional[str] = None
    fecha_inicio_qt: Optional[str] = None
    fecha_fin_qt: Optional[str] = None
    intencion_qt: Optional[str] = None
    primer_esquema: Optional[EsquemaQT] = None
    ultimo_esquema: Optional[EsquemaQT] = None

class Cirugia(BaseModel):
    recibio_cirugia: Optional[str] = None
    fecha_cirugia: Optional[str] = None
    tipo_cirugia: Optional[str] = None
    institucion_cirugia: Optional[str] = None

class Radioterapia(BaseModel):
    recibio_rt: Optional[str] = None
    fecha_inicio_rt: Optional[str] = None
    fecha_fin_rt: Optional[str] = None
    intencion_rt: Optional[str] = None
    tecnica_rt: Optional[str] = None
    dosis_total_rt: Optional[str] = None

class Trasplante(BaseModel):
    recibio_trasplante: Optional[str] = None
    fecha_trasplante: Optional[str] = None
    tipo_trasplante: Optional[str] = None

class CirugiaReconstructiva(BaseModel):
    recibio_cx_rec: Optional[str] = None
    fecha_cx_rec: Optional[str] = None
    tipo_cx_rec: Optional[str] = None

class CuidadosPaliativos(BaseModel):
    valorado: Optional[str] = None
    med_especialista_paliativo: Optional[str] = None
    prof_salud_especialista_paliativo: Optional[str] = None
    med_especialista_otra: Optional[str] = None
    med_general: Optional[str] = None
    trabajo_social: Optional[str] = None
    otro_prof_no_especializado: Optional[str] = None

class Resultado(BaseModel):
    estado_vital: Optional[str] = None
    fecha_muerte: Optional[str] = None
    causa_muerte: Optional[str] = None
    tipo_tratamiento_corte: Optional[str] = None
    fecha_bdua: Optional[str] = None


# ─── Modelo raíz de entrada ────────────────────────────────────────────────

class ReporteCAC(BaseModel):
    """
    Estructura completa de un reporte CAC (un solo registro).
    Todos los campos son opcionales para permitir validacion parcial.
    """
    cabecera: Optional[Cabecera] = Field(default_factory=Cabecera)
    paciente: Optional[Paciente] = Field(default_factory=Paciente)
    diagnostico: Optional[Diagnostico] = Field(default_factory=Diagnostico)
    terapia_sistemica: Optional[TerapiaSistemica] = Field(default_factory=TerapiaSistemica)
    cirugia: Optional[Cirugia] = Field(default_factory=Cirugia)
    radioterapia: Optional[Radioterapia] = Field(default_factory=Radioterapia)
    trasplante: Optional[Trasplante] = Field(default_factory=Trasplante)
    cirugia_reconstructiva: Optional[CirugiaReconstructiva] = Field(default_factory=CirugiaReconstructiva)
    cuidados_paliativos: Optional[CuidadosPaliativos] = Field(default_factory=CuidadosPaliativos)
    resultado: Optional[Resultado] = Field(default_factory=Resultado)
    reglas_levantadas: List[str] = Field(default_factory=list, description="IDs de reglas justificadas clinicamente")

    def to_dict(self) -> Dict[str, Any]:
        """Convierte a dict plano para el motor de validacion."""
        return self.model_dump(exclude_none=False)


# ─── Modelos de salida ─────────────────────────────────────────────────────

class ErrorValidacion(BaseModel):
    id: str = Field(description="Codigo del error (ej: E001)")
    campo: str = Field(description="Path del campo en el reporte (ej: paciente.primer_nombre)")
    tipo_error: str = Field(description="coherencia | estructura | definicion")
    descripcion: str = Field(description="Descripcion corta del error")
    detalle: Optional[str] = Field(default=None, description="Descripcion extendida")
    nivel: str = Field(default="ERROR", description="ERROR | ADVERTENCIA")

class ResultadoValidacion(BaseModel):
    valido: bool = Field(description="True si no hay errores de nivel ERROR")
    total_errores: int
    total_advertencias: int
    errores: List[ErrorValidacion] = Field(default_factory=list)
    errores_por_seccion: Dict[str, int] = Field(default_factory=dict)
    motor_version: str = Field(default="2.0")

class InfoMotor(BaseModel):
    version: str
    total_reglas: int
    tipos_reglas: Dict[str, int]
    grupos_dinamicos: List[str]
    estado: str
