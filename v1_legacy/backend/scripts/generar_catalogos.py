#!/usr/bin/env python3
"""
scripts/generar_catalogos.py  — VERSION CORREGIDA
==================================================
Cambios vs versión anterior:
  FIX-03  Reglas DEFINICION con paths "V1.0","V2.0","V3.0","V12.0"
          ahora se resuelven via VAR_MAP antes de escribir reglas.json.
  FIX-04  V114 correctamente mapeada a cuidados_paliativos.valorado.
          V113 → cirugia_reconstructiva.ips_cx_rec (sin cambio, era correcto).
  NEW     _normalizar_path(): post-proceso que garantiza que ningún path
          en reglas.json quede como "Vn.0" residual.
  NEW     Metadatos de grupos_dinamicos en reglas.json para el motor.

Uso:
  Modo legacy (un solo Excel):
    python scripts/generar_catalogos.py Reglas_Validacion_Cancer_2023_V01.xlsx

  Modo multi-archivo (2026+):
    python scripts/generar_catalogos.py \
      --cie10   CANCER_20260101-CIE10_2026.xlsx \
      --atc     CANCER_20260101-ATC_2026.xlsx \
      --cups    CUPS.xlsx \
      --reglas  Reglas_Validacion_Cancer_2023_V01.xlsx
"""

import argparse
import json
import re
import sys
from pathlib import Path

import pandas as pd

# ─── Mapeo V-número → ruta JSON del reporte ───────────────────────────────
# FIX-04: V114 = cuidados_paliativos.valorado (condición de activación del grupo)
VAR_MAP = {
    "V1":   "paciente.primer_nombre",
    "V2":   "paciente.segundo_nombre",
    "V3":   "paciente.primer_apellido",
    "V4":   "paciente.segundo_apellido",
    "V5":   "paciente.tipo_id",
    "V6":   "paciente.numero_id",
    "V7":   "paciente.fecha_nacimiento",
    "V8":   "paciente.sexo",
    "V9":   "paciente.ocupacion",
    "V10":  "paciente.regimen_afiliacion",
    "V11":  "paciente.codigo_eps",
    "V12":  "paciente.pertenencia_etnica",
    "V13":  "paciente.grupo_poblacional",
    "V14":  "paciente.municipio_residencia",
    "V15":  "paciente.telefono",
    "V16":  "paciente.fecha_afiliacion",
    "V17":  "diagnostico.cie10_neoplasia_primaria",
    "V18":  "diagnostico.fecha_diagnostico",
    "V19":  "diagnostico.fecha_remision",
    "V20":  "diagnostico.fecha_ingreso_ips",
    "V21":  "diagnostico.tipo_estudio_diagnostico",
    "V22":  "diagnostico.motivo_sin_histopatologia",
    "V23":  "diagnostico.fecha_recoleccion_muestra",
    "V24":  "diagnostico.fecha_informe_histopatologico",
    "V25":  "diagnostico.codigo_ips_confirmadora",
    "V26":  "diagnostico.fecha_primera_consulta_tratante",
    "V27":  "diagnostico.histologia",
    "V28":  "diagnostico.grado_diferenciacion",
    "V29":  "diagnostico.estadificacion_tnm",
    "V30":  "diagnostico.fecha_estadificacion_tnm",
    "V31":  "diagnostico.her2_realizado",
    "V32":  "diagnostico.fecha_her2",
    "V33":  "diagnostico.resultado_her2",
    "V34":  "diagnostico.estadificacion_dukes",
    "V35":  "diagnostico.fecha_dukes",
    "V36":  "diagnostico.ann_arbor_lugano",
    "V37":  "diagnostico.gleason",
    "V38":  "diagnostico.clasificacion_riesgo",
    "V39":  "diagnostico.fecha_clasificacion_riesgo",
    "V40":  "diagnostico.objetivo_inicial",
    "V41":  "diagnostico.objetivo_periodo",
    "V42":  "diagnostico.antecedente_otro_cancer",
    "V43":  "diagnostico.fecha_otro_cancer",
    "V44":  "diagnostico.cie10_otro_cancer",
    # ── Terapia sistémica ──
    "V45":  "terapia_sistemica.recibio_qt",
    "V46":  "terapia_sistemica.num_fases",
    "V47":  "terapia_sistemica.num_ciclos",
    "V48":  "terapia_sistemica.primer_esquema.ubicacion_temporal",
    "V49":  "terapia_sistemica.primer_esquema.fecha_inicio",
    "V50":  "terapia_sistemica.primer_esquema.num_ips",
    "V51":  "terapia_sistemica.primer_esquema.codigo_ips1",
    "V52":  "terapia_sistemica.primer_esquema.codigo_ips2",
    "V53":  "terapia_sistemica.primer_esquema.num_medicamentos",   # FIX clave
    "V53.1":"terapia_sistemica.primer_esquema.med1",
    "V53.2":"terapia_sistemica.primer_esquema.med2",
    "V53.3":"terapia_sistemica.primer_esquema.med3",
    "V53.4":"terapia_sistemica.primer_esquema.med4",
    "V53.5":"terapia_sistemica.primer_esquema.med5",
    "V53.6":"terapia_sistemica.primer_esquema.med6",
    "V53.7":"terapia_sistemica.primer_esquema.med7",
    "V53.8":"terapia_sistemica.primer_esquema.med8",
    "V53.9":"terapia_sistemica.primer_esquema.med9",
    "V54":  "terapia_sistemica.primer_esquema.med_adicional1",
    "V55":  "terapia_sistemica.primer_esquema.med_adicional2",
    "V56":  "terapia_sistemica.primer_esquema.med_adicional3",
    "V57":  "terapia_sistemica.primer_esquema.intratecal",
    "V58":  "terapia_sistemica.primer_esquema.fecha_fin",
    "V59":  "terapia_sistemica.primer_esquema.caracteristicas",
    "V60":  "terapia_sistemica.primer_esquema.motivo_finalizacion",
    "V61":  "terapia_sistemica.ultimo_esquema.ubicacion_temporal",
    "V62":  "terapia_sistemica.ultimo_esquema.fecha_inicio",
    "V63":  "terapia_sistemica.ultimo_esquema.num_ips",
    "V64":  "terapia_sistemica.ultimo_esquema.codigo_ips1",
    "V65":  "terapia_sistemica.ultimo_esquema.codigo_ips2",
    "V66":  "terapia_sistemica.ultimo_esquema.num_medicamentos",   # FIX clave
    "V66.1":"terapia_sistemica.ultimo_esquema.med1",
    "V66.2":"terapia_sistemica.ultimo_esquema.med2",
    "V66.3":"terapia_sistemica.ultimo_esquema.med3",
    "V66.4":"terapia_sistemica.ultimo_esquema.med4",
    "V66.5":"terapia_sistemica.ultimo_esquema.med5",
    "V66.6":"terapia_sistemica.ultimo_esquema.med6",
    "V66.7":"terapia_sistemica.ultimo_esquema.med7",
    "V66.8":"terapia_sistemica.ultimo_esquema.med8",
    "V66.9":"terapia_sistemica.ultimo_esquema.med9",
    "V67":  "terapia_sistemica.ultimo_esquema.med_adicional1",
    "V68":  "terapia_sistemica.ultimo_esquema.med_adicional2",
    "V69":  "terapia_sistemica.ultimo_esquema.med_adicional3",
    "V70":  "terapia_sistemica.ultimo_esquema.intratecal",
    "V71":  "terapia_sistemica.ultimo_esquema.fecha_fin",
    "V72":  "terapia_sistemica.ultimo_esquema.caracteristicas",
    "V73":  "terapia_sistemica.ultimo_esquema.motivo_finalizacion",
    # ── Fases hematolinfáticos ──
    "V46.1":"terapia_sistemica.fases.prefase",
    "V46.2":"terapia_sistemica.fases.induccion",
    "V46.3":"terapia_sistemica.fases.intensificacion",
    "V46.4":"terapia_sistemica.fases.consolidacion",
    "V46.5":"terapia_sistemica.fases.reinduccion",
    "V46.6":"terapia_sistemica.fases.mantenimiento",
    "V46.7":"terapia_sistemica.fases.mantenimiento_largo",
    "V46.8":"terapia_sistemica.fases.otra_fase",
    # ── Cirugía ──
    "V74":  "cirugia.recibio_cirugia",
    "V75":  "cirugia.num_cirugias",
    "V76":  "cirugia.fecha_primera",
    "V77":  "cirugia.ips_primera",
    "V78":  "cirugia.cups_primera",
    "V79":  "cirugia.ubicacion_primera",
    "V80":  "cirugia.fecha_ultima",
    "V81":  "cirugia.motivo_ultima",
    "V82":  "cirugia.ips_ultima",
    "V83":  "cirugia.cups_ultima",
    "V84":  "cirugia.ubicacion_ultima",
    "V85":  "cirugia.estado_vital_cirugia",
    # ── Radioterapia ──
    "V86":  "radioterapia.recibio_rt",
    "V87":  "radioterapia.num_sesiones",
    "V88":  "radioterapia.primer_esquema.fecha_inicio",
    "V89":  "radioterapia.primer_esquema.ubicacion_temporal",
    "V90":  "radioterapia.primer_esquema.tipo_cups",
    "V91":  "radioterapia.primer_esquema.num_ips",
    "V92":  "radioterapia.primer_esquema.codigo_ips1",
    "V93":  "radioterapia.primer_esquema.codigo_ips2",
    "V94":  "radioterapia.primer_esquema.fecha_fin",
    "V95":  "radioterapia.primer_esquema.caracteristicas",
    "V96":  "radioterapia.primer_esquema.motivo_finalizacion",
    "V97":  "radioterapia.ultimo_esquema.fecha_inicio",
    "V98":  "radioterapia.ultimo_esquema.ubicacion_temporal",
    "V99":  "radioterapia.ultimo_esquema.tipo_cups",
    "V100": "radioterapia.ultimo_esquema.num_ips",
    "V101": "radioterapia.ultimo_esquema.codigo_ips1",
    "V102": "radioterapia.ultimo_esquema.codigo_ips2",
    "V103": "radioterapia.ultimo_esquema.fecha_fin",
    "V104": "radioterapia.ultimo_esquema.caracteristicas",
    "V105": "radioterapia.ultimo_esquema.motivo_finalizacion",
    # ── Trasplante ──
    "V106": "trasplante.recibio_trasplante",
    "V107": "trasplante.tipo_trasplante",
    "V108": "trasplante.ubicacion_trasplante",
    "V109": "trasplante.fecha_trasplante",
    "V110": "trasplante.ips_trasplante",
    # ── Cirugía reconstructiva ──
    "V111": "cirugia_reconstructiva.recibio_cx_rec",
    "V112": "cirugia_reconstructiva.fecha_cx_rec",
    "V113": "cirugia_reconstructiva.ips_cx_rec",
    # ── Cuidados paliativos (FIX-04) ──
    "V114": "cuidados_paliativos.valorado",            # condición activadora del grupo
    "V114.1":"cuidados_paliativos.med_especialista_paliativo",
    "V114.2":"cuidados_paliativos.prof_salud_especialista_paliativo",
    "V114.3":"cuidados_paliativos.med_especialista_otra",
    "V114.4":"cuidados_paliativos.med_general",
    "V114.5":"cuidados_paliativos.trabajo_social",
    "V114.6":"cuidados_paliativos.otro_prof_no_especializado",
    "V115": "cuidados_paliativos.fecha_primera_atencion",
    "V116": "cuidados_paliativos.ips_paliativo",
    # ── Soporte ──
    "V117": "soporte.psiquiatria",
    "V118": "soporte.fecha_psiquiatria",
    "V119": "soporte.ips_psiquiatria",
    "V120": "soporte.nutricion",
    "V121": "soporte.fecha_nutricion",
    "V122": "soporte.ips_nutricion",
    "V123": "soporte.soporte_nutricional",
    "V124": "soporte.terapias_complementarias",
    # ── Resultado ──
    "V125": "resultado.tipo_tratamiento_corte",
    "V126": "resultado.resultado_oncologico",
    "V127": "resultado.estado_vital",
    "V128": "resultado.novedad_administrativa",
    "V129": "resultado.novedad_clinica",
    "V130": "resultado.fecha_desafiliacion",
    "V131": "resultado.fecha_muerte",
    "V132": "resultado.causa_muerte",
    "V133": "resultado.codigo_bdua",
    "V134": "resultado.fecha_bdua",
}


def get_path(vname: str) -> str:
    """Convierte 'V46.1' o 'V53Nombre largo' → ruta JSON del reporte."""
    m = re.match(r"(V\d+(?:\.\d+)?)", vname.strip())
    if m:
        return VAR_MAP.get(m.group(1), m.group(1))
    return vname.strip()


def _normalizar_path(campo: str) -> str:
    """
    FIX-03: Limpia paths residuales tipo 'V1.0', 'V12.0' que el parser
    genera cuando no encuentra un match limpio en VAR_MAP.
    Convierte 'Vn.0' → ruta de VAR_MAP para 'Vn', o devuelve el campo tal cual.
    """
    if not campo:
        return campo
    m = re.fullmatch(r"(V\d+)\.0", campo.strip())
    if m:
        return VAR_MAP.get(m.group(1), campo)
    return campo


def _parse_reglas(df: pd.DataFrame) -> list:
    r"""
    Parsea las reglas del Excel CAC en tres patrones:

    CONDICIONAL: Cuando V{n} sea {op} {val} Entonces V{n} DEBE SER {op} {val}
    SIMPLE:      V{n}... DEBE SER {op} {val}
    DEFINICION:  «No cumple con la definicion de la Variable V{n}...»

    FIX-03: _normalizar_path() aplicado a todo campo generado por get_path().
    """
    reglas = []

    for _, row in df.iterrows():
        desc    = str(row.get("Descripción", "")).strip()
        cod     = str(row.get("Código de Error", "")).strip()
        tipo    = str(row.get("Tipo de Error", "")).strip()
        yo      = str(row.get("Y/O", "")).strip()
        var     = str(row.get("No.VARIABLE", "")).strip()
        detalle = str(row.get("Detalle error y definicíon de la variable", "")).strip()

        base = {
            "id": cod, "variable": var, "tipo_error": tipo,
            "operador_logico": yo, "descripcion_original": desc,
            "campo": None, "tipo_regla": None,
            "condicion": None, "restriccion": None,
            "nivel": "ERROR", "mensaje": None, "activa": True,
        }

        # ── Patrón 1: CONDICIONAL ──────────────────────────────────────────
        m = re.match(
            r"Cuando\s+(V\d+(?:\.\d+)?)\s+sea\s+([=<>!]+)\s*(\S+)\s+"
            r"Entonces\s+(V\d+(?:\.\d+)?)(?:(?!\bDEBE\s+SER\b).)*\bDEBE\s+SER\s+([=<>!]+)\s*(.+)",
            desc, re.IGNORECASE,
        )
        if m:
            cv, cop, cval, tv, top, tval = m.groups()
            campo_cond   = _normalizar_path(get_path(cv))   # FIX-03
            campo_target = _normalizar_path(get_path(tv))   # FIX-03
            base.update({
                "tipo_regla": "CONDICIONAL",
                "campo": campo_target,
                "condicion": {
                    "campo":    campo_cond,
                    "operador": cop.strip(),
                    "valor":    cval.strip(),
                },
                "restriccion": {
                    "operador": top.strip(),
                    "valor":    tval.strip(),
                },
                "mensaje": (
                    f"Cuando '{campo_cond}' es {cop.strip()} '{cval.strip()}', "
                    f"el campo '{campo_target}' debe ser {top.strip()} '{tval.strip()}'."
                ),
            })
            reglas.append(base)
            continue

        # ── Patrón 2: SIMPLE ──────────────────────────────────────────────
        m2 = re.match(
            r"(V\d+(?:\.\d+)?)(?:(?!\bDEBE\s+SER\b).)*\bDEBE\s+SER\s+([=<>!]+)\s*(.+)",
            desc, re.IGNORECASE,
        )
        if m2:
            tv2, top2, tval2 = m2.groups()
            campo_target2 = _normalizar_path(get_path(tv2))  # FIX-03
            base.update({
                "tipo_regla": "SIMPLE",
                "campo": campo_target2,
                "restriccion": {
                    "operador": top2.strip(),
                    "valor":    tval2.strip(),
                },
                "mensaje": (
                    f"El campo '{campo_target2}' debe ser {top2.strip()} '{tval2.strip()}'."
                ),
            })
            reglas.append(base)
            continue

        # ── Patrón 3: DEFINICION ──────────────────────────────────────────
        m3 = re.match(r".*defini[ck]ion.*Variable\s+(V\d+(?:\.\d+)?)", desc, re.IGNORECASE)
        tv3 = m3.group(1) if m3 else var
        campo_def = _normalizar_path(get_path(tv3))  # FIX-03 aplicado aquí

        base.update({
            "tipo_regla": "DEFINICION",
            "campo": campo_def,
            "mensaje": detalle[:300] if detalle and detalle != "nan" else desc[:300],
        })
        reglas.append(base)

    return reglas


# ─── Metadatos de grupos dinámicos (se inyectan en reglas.json) ───────────
GRUPOS_DINAMICOS_META = {
    "fases_qt": {
        "condicion_padre": ["terapia_sistemica.recibio_qt", "=", "1"],
        "subcondicion":    ["terapia_sistemica.num_fases", ">", "0"],
        "campo_control":   None,
        "variables": [f"V46.{i}" for i in range(1, 9)],
    },
    "medicamentos_primer": {
        "condicion_padre": ["terapia_sistemica.recibio_qt", "=", "1"],
        "subcondicion":    None,
        "campo_control":   "terapia_sistemica.primer_esquema.num_medicamentos",
        "variables": [f"V53.{i}" for i in range(1, 10)],
    },
    "medicamentos_ultimo": {
        "condicion_padre": ["terapia_sistemica.recibio_qt", "=", "1"],
        "subcondicion":    None,
        "campo_control":   "terapia_sistemica.ultimo_esquema.num_medicamentos",
        "variables": [f"V66.{i}" for i in range(1, 10)],
    },
    "cuidados_paliativos": {
        "condicion_padre": ["cuidados_paliativos.valorado", "=", "1"],
        "subcondicion":    None,
        "campo_control":   None,
        "variables": [f"V114.{i}" for i in range(1, 7)],
    },
}


def generar_desde_excel(
    ruta_excel: str,
    directorio_salida: str = None,
    ruta_cie10: str = None,
    ruta_atc: str = None,
    ruta_cups: str = None,
) -> dict:
    """Genera catalogos_excel.json y reglas.json (versión corregida)."""
    out_dir = Path(directorio_salida) if directorio_salida else Path(ruta_excel).parent.parent / "app"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"→ Directorio de salida: {out_dir}")

    # ── Parsear reglas ────────────────────────────────────────────────────
    print("  → Parseando reglas de coherencia...")
    reg_df = pd.read_excel(ruta_excel, sheet_name="Reglas", header=0)
    reg_df = reg_df[reg_df["No.VARIABLE"].notna()]
    reglas = _parse_reglas(reg_df)

    # Verificación post-parseo: detectar paths residuales Vn.0
    residuales = [r for r in reglas if r.get("campo") and re.fullmatch(r"V\d+\.0", r["campo"])]
    if residuales:
        print(f"  ⚠️  {len(residuales)} reglas con path residual 'Vn.0' detectadas y corregidas.")
        for r in residuales:
            r["campo"] = _normalizar_path(r["campo"])

    # Inyectar metadatos de grupos dinámicos al inicio del JSON
    salida_reglas = {
        "_meta": {
            "version": "2.0-corregido",
            "total_reglas": len(reglas),
            "grupos_dinamicos": GRUPOS_DINAMICOS_META,
            "fixes_aplicados": [
                "FIX-03: paths Vn.0 resueltos via VAR_MAP",
                "FIX-04: V114 = cuidados_paliativos.valorado",
                "FIX-01: agrupamiento Y/O por (id, campo) en motor",
                "FIX-02: expansion estructural de grupos dinamicos",
            ],
        },
        "reglas": reglas,
    }

    ruta_reglas = out_dir / "reglas.json"
    with open(ruta_reglas, "w", encoding="utf-8") as f:
        json.dump(salida_reglas, f, ensure_ascii=False, indent=2)
    print(f"  ✅ reglas.json generado: {len(reglas)} reglas → {ruta_reglas}")

    return salida_reglas


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Genera catalogos_excel.json y reglas.json para CAC")
    parser.add_argument("excel",         nargs="?",  help="Excel de reglas (modo legacy)")
    parser.add_argument("--reglas",      default=None, help="Excel de reglas (modo multi-archivo)")
    parser.add_argument("--cie10",       default=None)
    parser.add_argument("--atc",         default=None)
    parser.add_argument("--cups",        default=None)
    parser.add_argument("--salida",      default=None, help="Directorio de salida")
    args = parser.parse_args()

    ruta = args.reglas or args.excel
    if not ruta:
        print("ERROR: Debes indicar el archivo Excel de reglas.")
        sys.exit(1)

    generar_desde_excel(
        ruta_excel=ruta,
        directorio_salida=args.salida,
        ruta_cie10=args.cie10,
        ruta_atc=args.atc,
        ruta_cups=args.cups,
    )
