# app/validators/base.py
"""
Validaciones de capa 1: formato, rango y coherencia temporal.
Cada función devuelve lista de ErrorDetalle.
"""
from datetime import datetime
from typing import List, Optional
from app.schemas.cac import CACReport
from app.schemas.common import ErrorDetalle, FECHAS_ESPECIALES


def _err(errores: List[ErrorDetalle], id_regla: str, campo: Optional[str],
         mensaje: str, nivel: str = "ERROR", variable_res: Optional[str] = None):
    errores.append(ErrorDetalle(
        id_regla=id_regla, campo=campo, nivel=nivel,
        mensaje=mensaje, variable_res=variable_res
    ))


def _parse(valor: Optional[str]) -> Optional[datetime]:
    """Devuelve datetime o None si es fecha especial o vacío."""
    if not valor or valor in FECHAS_ESPECIALES:
        return None
    try:
        return datetime.strptime(valor.strip(), "%Y-%m-%d")
    except ValueError:
        return None


def _es_especial(valor: Optional[str]) -> bool:
    return valor in FECHAS_ESPECIALES


def validar_formato_fechas(r: CACReport) -> List[ErrorDetalle]:
    """Valida que las fechas tengan formato AAAA-MM-DD o sean especiales válidas."""
    errores: List[ErrorDetalle] = []
    campos_fecha = [
        ("paciente.fecha_nacimiento",                          r.paciente.fecha_nacimiento,                          "V7"),
        ("paciente.fecha_afiliacion",                          r.paciente.fecha_afiliacion,                          "V16"),
        ("diagnostico.fecha_diagnostico",                      r.diagnostico.fecha_diagnostico,                      "V18"),
        ("diagnostico.fecha_remision",                         r.diagnostico.fecha_remision,                         "V19"),
        ("diagnostico.fecha_ingreso_ips",                      r.diagnostico.fecha_ingreso_ips,                      "V20"),
        ("diagnostico.fecha_recoleccion_muestra",              r.diagnostico.fecha_recoleccion_muestra,              "V23"),
        ("diagnostico.fecha_informe_histopatologico",          r.diagnostico.fecha_informe_histopatologico,          "V24"),
        ("diagnostico.fecha_primera_consulta_tratante",        r.diagnostico.fecha_primera_consulta_tratante,        "V26"),
        ("diagnostico.fecha_estadificacion_tnm",               r.diagnostico.fecha_estadificacion_tnm,               "V30"),
        ("diagnostico.fecha_her2",                             r.diagnostico.fecha_her2,                             "V32"),
        ("diagnostico.fecha_dukes",                            r.diagnostico.fecha_dukes,                            "V35"),
        ("diagnostico.fecha_clasificacion_riesgo",             r.diagnostico.fecha_clasificacion_riesgo,             "V39"),
        ("diagnostico.fecha_otro_cancer",                      r.diagnostico.fecha_otro_cancer,                      "V43"),
        ("terapia_sistemica.primer_esquema.fecha_inicio",      r.terapia_sistemica.primer_esquema.fecha_inicio if r.terapia_sistemica.primer_esquema else None, "V49"),
        ("terapia_sistemica.primer_esquema.fecha_fin",         r.terapia_sistemica.primer_esquema.fecha_fin if r.terapia_sistemica.primer_esquema else None,    "V58"),
        ("terapia_sistemica.ultimo_esquema.fecha_inicio",      r.terapia_sistemica.ultimo_esquema.fecha_inicio if r.terapia_sistemica.ultimo_esquema else None,  "V62"),
        ("terapia_sistemica.ultimo_esquema.fecha_fin",         r.terapia_sistemica.ultimo_esquema.fecha_fin if r.terapia_sistemica.ultimo_esquema else None,     "V71"),
        ("cirugia.fecha_primera",                              r.cirugia.fecha_primera,                              "V76"),
        ("cirugia.fecha_ultima",                               r.cirugia.fecha_ultima,                               "V80"),
        ("radioterapia.primer_esquema.fecha_inicio",           r.radioterapia.primer_esquema.fecha_inicio if r.radioterapia.primer_esquema else None,            "V88"),
        ("radioterapia.primer_esquema.fecha_fin",              r.radioterapia.primer_esquema.fecha_fin if r.radioterapia.primer_esquema else None,               "V94"),
        ("radioterapia.ultimo_esquema.fecha_inicio",           r.radioterapia.ultimo_esquema.fecha_inicio if r.radioterapia.ultimo_esquema else None,            "V97"),
        ("radioterapia.ultimo_esquema.fecha_fin",              r.radioterapia.ultimo_esquema.fecha_fin if r.radioterapia.ultimo_esquema else None,               "V103"),
        ("trasplante.fecha_trasplante",                        r.trasplante.fecha_trasplante,                        "V109"),
        ("cirugia_reconstructiva.fecha_cx_rec",                r.cirugia_reconstructiva.fecha_cx_rec,                "V112"),
        ("cuidados_paliativos.fecha_primera_atencion",         r.cuidados_paliativos.fecha_primera_atencion,         "V115"),
        ("soporte.fecha_psiquiatria",                          r.soporte.fecha_psiquiatria,                          "V118"),
        ("soporte.fecha_nutricion",                            r.soporte.fecha_nutricion,                            "V121"),
        ("resultado.fecha_desafiliacion",                      r.resultado.fecha_desafiliacion,                      "V130"),
        ("resultado.fecha_muerte",                             r.resultado.fecha_muerte,                             "V131"),
    ]
    for campo, valor, var in campos_fecha:
        if not valor:
            continue
        if valor in FECHAS_ESPECIALES:
            continue
        try:
            datetime.strptime(valor.strip(), "%Y-%m-%d")
        except ValueError:
            _err(errores, f"FMT-{var}", campo,
                 f"Formato de fecha inválido en '{campo}'. Use AAAA-MM-DD o una fecha "
                 f"especial válida (1800-01-01, 1845-01-01, 1846-01-01). (Variable {var})",
                 variable_res=var)
    return errores


def validar_coherencia_temporal(r: CACReport) -> List[ErrorDetalle]:
    errores: List[ErrorDetalle] = []

    fn = _parse(r.paciente.fecha_nacimiento)
    fd = _parse(r.diagnostico.fecha_diagnostico)
    fc = _parse(r.cabecera.fecha_corte)
    fm = _parse(r.resultado.fecha_muerte)

    # R-020: fecha_diagnostico >= fecha_nacimiento
    if fn and fd and fd < fn:
        _err(errores, "R-020", "diagnostico.fecha_diagnostico",
             "La fecha de diagnóstico no puede ser anterior a la fecha de nacimiento del usuario.",
             variable_res="V18")

    # R-021: fecha_remision <= fecha_ingreso_ips
    fr = _parse(r.diagnostico.fecha_remision)
    fi = _parse(r.diagnostico.fecha_ingreso_ips)
    if fr and fi and fr > fi:
        _err(errores, "R-021", "diagnostico.fecha_remision",
             "La fecha de remisión (V19) debe ser anterior o igual a la fecha de ingreso a la institución diagnóstica (V20).",
             variable_res="V19")

    # R-022: fecha_recoleccion_muestra <= fecha_informe_histopatologico
    fm_rec = _parse(r.diagnostico.fecha_recoleccion_muestra)
    fi_histo = _parse(r.diagnostico.fecha_informe_histopatologico)
    if fm_rec and fi_histo and fm_rec > fi_histo:
        _err(errores, "R-022", "diagnostico.fecha_recoleccion_muestra",
             "La fecha de recolección de muestra (V23) debe ser anterior o igual a la fecha del informe histopatológico (V24).",
             variable_res="V23")

    # R-023: fechas tratamiento >= fecha_diagnostico
    if r.terapia_sistemica.primer_esquema:
        fi_qt = _parse(r.terapia_sistemica.primer_esquema.fecha_inicio)
        if fd and fi_qt and fi_qt < fd:
            _err(errores, "R-023", "terapia_sistemica.primer_esquema.fecha_inicio",
                 "La fecha de inicio de quimioterapia no puede ser anterior a la fecha de diagnóstico del cáncer.",
                 variable_res="V49")
        ff_qt = _parse(r.terapia_sistemica.primer_esquema.fecha_fin)
        if fi_qt and ff_qt and ff_qt < fi_qt:
            _err(errores, "R-024", "terapia_sistemica.primer_esquema.fecha_fin",
                 "La fecha de finalización del primer esquema de QT no puede ser anterior a su fecha de inicio.",
                 variable_res="V58")

    # R-025: fecha primera cirugía >= fecha_diagnostico
    if r.cirugia.recibio_cirugia == "1":
        fc_cx = _parse(r.cirugia.fecha_primera)
        if fd and fc_cx and fc_cx < fd:
            _err(errores, "R-025", "cirugia.fecha_primera",
                 "La fecha de la primera cirugía no puede ser anterior a la fecha de diagnóstico del cáncer.",
                 variable_res="V76")
        # R-026: última cirugía >= primera (si hay más de 1)
        fc_ult = _parse(r.cirugia.fecha_ultima)
        if fc_cx and fc_ult and fc_ult < fc_cx:
            _err(errores, "R-026", "cirugia.fecha_ultima",
                 "La fecha de la última cirugía no puede ser anterior a la primera cirugía en el período.",
                 variable_res="V82")

    # R-027: fecha RT >= fecha_diagnostico
    if r.radioterapia.recibio_rt == "1" and r.radioterapia.primer_esquema:
        fi_rt = _parse(r.radioterapia.primer_esquema.fecha_inicio)
        if fd and fi_rt and fi_rt < fd:
            _err(errores, "R-027", "radioterapia.primer_esquema.fecha_inicio",
                 "La fecha de inicio de radioterapia no puede ser anterior a la fecha de diagnóstico del cáncer.",
                 variable_res="V89")

    # R-028: fecha_muerte >= fecha_nacimiento y >= fecha_diagnostico
    fm_muerte = _parse(r.resultado.fecha_muerte)
    if fm_muerte:
        if fn and fm_muerte < fn:
            _err(errores, "R-028-A", "resultado.fecha_muerte",
                 "La fecha de muerte no puede ser anterior a la fecha de nacimiento del usuario.",
                 variable_res="V129")
        if fd and fm_muerte < fd:
            _err(errores, "R-028-B", "resultado.fecha_muerte",
                 "La fecha de muerte no puede ser anterior a la fecha de diagnóstico del cáncer.",
                 variable_res="V129")

    # R-060 (advertencia): fecha_diagnostico <= fecha_corte
    if fd and fc and fd > fc:
        _err(errores, "R-060", "diagnostico.fecha_diagnostico",
             "La fecha de diagnóstico es posterior a la fecha de corte del período. Verifique si el dato es correcto.",
             nivel="ADVERTENCIA", variable_res="V18")

    return errores
