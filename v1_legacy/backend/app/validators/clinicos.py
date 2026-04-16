# app/validators/clinicos.py
"""
Validaciones de capa 2: coherencia clínica según tipo de cáncer (CIE-10)
y coherencia de tratamientos y novedades.
Los catálogos de CIE-10, CUPS y ATC se cargan desde catalogos_excel.json
generado a partir del Excel oficial 'Reglas Validación Cáncer 2023 V01.xlsx'.
"""
from typing import List, Optional
from app.schemas.cac import CACReport
from app.schemas.common import ErrorDetalle, FECHAS_ESPECIALES
from app.catalogos import (
    CIE10_VALIDOS, CIE10_SOLO_F, CIE10_SOLO_M,
    CUPS_VALIDOS, ATC_VALIDOS,
)

# ──────────── prefijos CIE-10 ────────────
CIE_MAMA              = ("C50",)
CIE_COLORRECTAL       = ("C18", "C19", "C20")
CIE_PROSTATA          = ("C61",)
CIE_LINFOMA_MIELOMA   = ("C81", "C82", "C83", "C84", "C85", "C90")
CIE_LEUCEMIA          = ("C91", "C92", "C93", "C94", "C95")
CIE_HEMATOLINFATICO   = CIE_LINFOMA_MIELOMA + CIE_LEUCEMIA
CIE_SNC               = ("C70", "C71", "C72")
CIE_PIEL_BASOCELULAR  = ("C44",)


def _err(errores: List[ErrorDetalle], id_regla: str, campo: Optional[str],
         mensaje: str, nivel: str = "ERROR", variable_res: Optional[str] = None):
    errores.append(ErrorDetalle(
        id_regla=id_regla, campo=campo, nivel=nivel,
        mensaje=mensaje, variable_res=variable_res
    ))


def _empieza(cie: str, prefijos: tuple) -> bool:
    return any(cie.upper().startswith(p) for p in prefijos)


def _es_no_aplica(valor: Optional[str]) -> bool:
    """98 = No Aplica como código numérico."""
    return valor in {"98", "55", None, ""}


def _es_valor_clinico(valor: Optional[str]) -> bool:
    """True si tiene un valor real (no especial, no vacío)."""
    return valor is not None and valor not in {"", "55", "98", "99", "97", "96"}


# ──────────── Obligatoriedad básica ────────────
def validar_obligatorios(r: CACReport) -> List[ErrorDetalle]:
    errores: List[ErrorDetalle] = []
    campos = [
        ("paciente.primer_nombre", r.paciente.primer_nombre, "V1"),
        ("paciente.primer_apellido", r.paciente.primer_apellido, "V3"),
        ("paciente.tipo_id", r.paciente.tipo_id, "V5"),
        ("paciente.numero_id", r.paciente.numero_id, "V6"),
        ("paciente.fecha_nacimiento", r.paciente.fecha_nacimiento, "V7"),
        ("paciente.sexo", r.paciente.sexo, "V8"),
        ("paciente.regimen_afiliacion", r.paciente.regimen_afiliacion, "V10"),
        ("paciente.codigo_eps", r.paciente.codigo_eps, "V11"),
        ("paciente.municipio_residencia", r.paciente.municipio_residencia, "V14"),
        ("diagnostico.cie10_neoplasia_primaria", r.diagnostico.cie10_neoplasia_primaria, "V17"),
        ("diagnostico.fecha_diagnostico", r.diagnostico.fecha_diagnostico, "V18"),
        ("diagnostico.tipo_estudio_diagnostico", r.diagnostico.tipo_estudio_diagnostico, "V21"),
        ("diagnostico.objetivo_inicial", r.diagnostico.objetivo_inicial, "V40"),
        ("diagnostico.objetivo_periodo", r.diagnostico.objetivo_periodo, "V41"),
        ("diagnostico.antecedente_otro_cancer", r.diagnostico.antecedente_otro_cancer, "V42"),
        ("resultado.tipo_tratamiento_corte", r.resultado.tipo_tratamiento_corte, "V123"),
        ("resultado.resultado_oncologico", r.resultado.resultado_oncologico, "V124"),
        ("resultado.estado_vital", r.resultado.estado_vital, "V125"),
        ("resultado.novedad_administrativa", r.resultado.novedad_administrativa, "V126"),
        ("resultado.novedad_clinica", r.resultado.novedad_clinica, "V127"),
    ]
    for campo, valor, var in campos:
        if not valor or valor.strip() == "":
            _err(errores, f"OBL-{var}", campo,
                 f"El campo '{campo}' es obligatorio y no puede quedar vacío. (Variable {var})",
                 variable_res=var)
    return errores


# ──────────── Coherencia clínica por tipo de tumor ────────────
def validar_tipo_cancer(r: CACReport) -> List[ErrorDetalle]:
    errores: List[ErrorDetalle] = []
    cie = r.diagnostico.cie10_neoplasia_primaria.upper().strip()
    sexo = r.paciente.sexo.upper().strip()

    # ── R-CIE-CAC: el CIE-10 debe estar en el catálogo oficial del Excel ──
    if CIE10_VALIDOS and cie not in CIE10_VALIDOS:
        _err(errores, "R-CIE-CAC", "diagnostico.cie10_neoplasia_primaria",
             f"El código CIE-10 '{cie}' no se encuentra en el catálogo de neoplasias "
             f"válidas del CAC (Res. 0247). Verifique el código.",
             variable_res="V17")

    # ── R-SEXO-M: CIE-10 exclusivo de hombres (próstata, pene, testículo…) ──
    # Regla extraída directamente del Excel: 18 códigos solo masculinos
    if cie in CIE10_SOLO_M and sexo != "M":
        _err(errores, "R-SEXO-M", "paciente.sexo",
             f"El diagnóstico '{cie}' corresponde a un tumor exclusivo del sexo masculino "
             f"(próstata, pene, testículo u órgano genital masculino). "
             f"El sexo registrado es '{sexo}'. Verifique el CIE-10 o el sexo del paciente. "
             f"(Regla B4811 del Excel de validación)",
             variable_res="V8")

    # ── R-SEXO-F: CIE-10 exclusivo de mujeres (útero, ovario, cuello, vulva…) ──
    # Regla extraída directamente del Excel: 35 códigos solo femeninos
    if cie in CIE10_SOLO_F and sexo != "F":
        _err(errores, "R-SEXO-F", "paciente.sexo",
             f"El diagnóstico '{cie}' corresponde a un tumor exclusivo del sexo femenino "
             f"(útero, ovario, vulva, vagina u órgano genital femenino). "
             f"El sexo registrado es '{sexo}'. Verifique el CIE-10 o el sexo del paciente. "
             f"(Regla B4811 del Excel de validación)",
             variable_res="V8")

    # ── R-030: cáncer de mama → HER2
    if _empieza(cie, CIE_MAMA):
        her2 = r.diagnostico.her2_realizado
        if her2 in {"98", None, ""} and "in situ" not in cie.lower():
            _err(errores, "R-030", "diagnostico.her2_realizado",
                 "Para cáncer de mama que no es in situ, debe registrar si se realizó la prueba HER2 (variable 31).",
                 variable_res="V31")
    else:
        # HER2 debe ser 98 si no es mama
        if _es_valor_clinico(r.diagnostico.her2_realizado) and r.diagnostico.her2_realizado not in {"97", "99"}:
            if r.diagnostico.her2_realizado == "1":
                pass  # podría ser error pero no bloqueamos
        pass

    # R-031: cáncer colorrectal → Dukes
    if _empieza(cie, CIE_COLORRECTAL):
        if _es_no_aplica(r.diagnostico.estadificacion_dukes):
            _err(errores, "R-031", "diagnostico.estadificacion_dukes",
                 "Para cáncer colorrectal, debe registrar la estadificación de Dukes (variable 34).",
                 variable_res="V34")

    # R-032: próstata → Gleason
    if _empieza(cie, CIE_PROSTATA):
        if _es_no_aplica(r.diagnostico.gleason):
            _err(errores, "R-032", "diagnostico.gleason",
                 "Para cáncer de próstata, debe registrar la clasificación Gleason (variable 37).",
                 variable_res="V37")

    # R-033: linfoma/mieloma → Ann Arbor/Lugano
    if _empieza(cie, CIE_LINFOMA_MIELOMA):
        if _es_no_aplica(r.diagnostico.ann_arbor_lugano):
            _err(errores, "R-033", "diagnostico.ann_arbor_lugano",
                 "Para linfoma o mieloma, debe registrar la estadificación Ann Arbor / Lugano (variable 36).",
                 variable_res="V36")

    # R-034: tipo estudio 7 → motivo sin histo
    if r.diagnostico.tipo_estudio_diagnostico == "7":
        if not _es_valor_clinico(r.diagnostico.motivo_sin_histopatologia) or \
           r.diagnostico.motivo_sin_histopatologia in {"98"}:
            _err(errores, "R-034", "diagnostico.motivo_sin_histopatologia",
                 "Si el diagnóstico fue clínico sin histopatología (opción 7), debe registrar el motivo en la variable 22.",
                 variable_res="V22")
        # fechas histo deben ser 1845-01-01
        if r.diagnostico.fecha_recoleccion_muestra and \
           r.diagnostico.fecha_recoleccion_muestra not in {"1845-01-01", "1846-01-01", ""}:
            _err(errores, "R-051", "diagnostico.fecha_recoleccion_muestra",
                 "Si no se realizó histopatología (V21=7), la fecha de recolección de muestra (V23) debe ser 1845-01-01.",
                 variable_res="V23")
    else:
        # tipo estudio ≠ 7 → motivo debe ser 98
        if r.diagnostico.motivo_sin_histopatologia and \
           r.diagnostico.motivo_sin_histopatologia not in {"98", "55", "", None}:
            _err(errores, "R-050", "diagnostico.motivo_sin_histopatologia",
                 "Si se realizó histopatología (V21 ≠ 7), el motivo de ausencia de histopatología (V22) debe ser 98.",
                 variable_res="V22")

    # R-052: cáncer hematológico → TNM = 98
    if _empieza(cie, CIE_HEMATOLINFATICO + CIE_SNC):
        if _es_valor_clinico(r.diagnostico.estadificacion_tnm):
            _err(errores, "R-052", "diagnostico.estadificacion_tnm",
                 "Para cáncer hematológico o SNC, la estadificación TNM/FIGO no aplica. Registre 98 en la variable 29.",
                 variable_res="V29")

    return errores


# ──────────── Coherencia de tratamientos ────────────
def validar_tratamientos(r: CACReport) -> List[ErrorDetalle]:
    errores: List[ErrorDetalle] = []
    qt = r.terapia_sistemica

    # R-035/R-036: si recibio_qt=1 → debe haber primer esquema con fecha e IPS
    if qt.recibio_qt == "1":
        if not qt.primer_esquema:
            _err(errores, "R-035", "terapia_sistemica.primer_esquema",
                 "Si el usuario recibió terapia sistémica, debe registrar el primer esquema de quimioterapia.",
                 variable_res="V49")
        elif not qt.primer_esquema.fecha_inicio or qt.primer_esquema.fecha_inicio in {"1845-01-01", ""}:
            _err(errores, "R-035", "terapia_sistemica.primer_esquema.fecha_inicio",
                 "Si el usuario recibió terapia sistémica, debe registrar la fecha de inicio del primer esquema (V49).",
                 variable_res="V49")
        if qt.primer_esquema and (not qt.primer_esquema.ips1 or qt.primer_esquema.ips1 == "98"):
            _err(errores, "R-036", "terapia_sistemica.primer_esquema.ips1",
                 "Si el usuario recibió quimioterapia, debe registrar el código de la IPS que suministró el primer ciclo (V51).",
                 variable_res="V51")

    # R-037: cirugía=1 → debe haber fecha y CUPS
    if r.cirugia.recibio_cirugia == "1":
        if not r.cirugia.fecha_primera or r.cirugia.fecha_primera in {"1845-01-01", ""}:
            _err(errores, "R-037-A", "cirugia.fecha_primera",
                 "Si el usuario fue operado, debe registrar la fecha de la primera cirugía (V76).",
                 variable_res="V76")
        if not r.cirugia.cups_primera or r.cirugia.cups_primera == "98":
            _err(errores, "R-037-B", "cirugia.cups_primera",
                 "Si el usuario fue operado, debe registrar el código CUPS de la primera cirugía (V78).",
                 variable_res="V78")

    # R-038: radioterapia=1 → debe haber primer esquema
    if r.radioterapia.recibio_rt == "1":
        if not r.radioterapia.primer_esquema:
            _err(errores, "R-038", "radioterapia.primer_esquema",
                 "Si el usuario recibió radioterapia, debe registrar al menos el primer esquema con fechas e IPS (V89).",
                 variable_res="V89")

    return errores


# ──────────── Estado vital y novedades ────────────
def validar_estado_vital(r: CACReport) -> List[ErrorDetalle]:
    errores: List[ErrorDetalle] = []
    res = r.resultado

    # R-040: fallecido → fecha y causa de muerte obligatorias
    if res.estado_vital == "2":
        if not res.fecha_muerte or res.fecha_muerte in {"", "1845-01-01"}:
            _err(errores, "R-040-A", "resultado.fecha_muerte",
                 "Si el usuario está fallecido, debe registrar la fecha de muerte (V129).",
                 variable_res="V129")
        if not res.causa_muerte or res.causa_muerte in {"", "98"}:
            _err(errores, "R-040-B", "resultado.causa_muerte",
                 "Si el usuario está fallecido, debe registrar la causa de muerte (V130).",
                 variable_res="V130")

    # R-041: desafiliación (novedad=5) → fecha desafiliación
    if res.novedad_administrativa == "5":
        if not res.fecha_desafiliacion or res.fecha_desafiliacion in {"", "1845-01-01"}:
            _err(errores, "R-041", "resultado.fecha_desafiliacion",
                 "Si el usuario se desafilió (novedad administrativa = 5), debe registrar la fecha de desafiliación (V128).",
                 variable_res="V128")

    # R-042 (advertencia): estado vital ≠ 2 → fecha muerte debe ser 1845-01-01 o vacío
    if res.estado_vital != "2" and res.fecha_muerte and \
       res.fecha_muerte not in {"1845-01-01", "1846-01-01", "", None}:
        _err(errores, "R-042", "resultado.fecha_muerte",
             "El usuario no está registrado como fallecido, pero tiene fecha de muerte. Verifique el estado vital (V125).",
             nivel="ADVERTENCIA", variable_res="V125")

    # R-055: fecha_bdua fija
    if res.fecha_bdua != "2024-01-01":
        _err(errores, "R-055", "resultado.fecha_bdua",
             "La variable 134 (fecha BDUA) debe tener el valor fijo 2024-01-01.",
             variable_res="V134")

    return errores
