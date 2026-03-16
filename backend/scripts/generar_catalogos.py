#!/usr/bin/env python3
"""
scripts/generar_catalogos.py
============================
Extrae catálogos y reglas desde los archivos oficiales de la CAC y genera:

  app/catalogos_excel.json   — CIE-10, CUPS, ATC, sexo-específicos
  app/reglas.json            — 2.000+ reglas estructuradas y ejecutables

Formatos soportados:
  Modo LEGACY (un solo Excel con todas las hojas):
    python scripts/generar_catalogos.py Reglas_Validación_Cáncer_2023_V01.xlsx

  Modo MULTI-ARCHIVO (archivos separados por catálogo — formato 2026+):
    python scripts/generar_catalogos.py \\
      --cie10   CANCER_20260101-CIE10_2026.xlsx \\
      --atc     CANCER_20260101-ATC_2026.xlsx \\
      --cups    CUPS.xlsx \\
      --reglas  Reglas_Validación_Cáncer_2023_V01.xlsx
"""

import argparse
import json
import re
import sys
from pathlib import Path

import pandas as pd

# ─── Mapeo V-número → ruta JSON del reporte ────────────────────────────────
VAR_MAP = {
    "V1":  "paciente.primer_nombre",
    "V2":  "paciente.segundo_nombre",
    "V3":  "paciente.primer_apellido",
    "V4":  "paciente.segundo_apellido",
    "V5":  "paciente.tipo_id",
    "V6":  "paciente.numero_id",
    "V7":  "paciente.fecha_nacimiento",
    "V8":  "paciente.sexo",
    "V9":  "paciente.ocupacion",
    "V10": "paciente.regimen_afiliacion",
    "V11": "paciente.codigo_eps",
    "V12": "paciente.pertenencia_etnica",
    "V13": "paciente.grupo_poblacional",
    "V14": "paciente.municipio_residencia",
    "V15": "paciente.telefono",
    "V16": "paciente.fecha_afiliacion",
    "V17": "diagnostico.cie10_neoplasia_primaria",
    "V18": "diagnostico.fecha_diagnostico",
    "V19": "diagnostico.fecha_remision",
    "V20": "diagnostico.fecha_ingreso_ips",
    "V21": "diagnostico.tipo_estudio_diagnostico",
    "V22": "diagnostico.motivo_sin_histopatologia",
    "V23": "diagnostico.fecha_recoleccion_muestra",
    "V24": "diagnostico.fecha_informe_histopatologico",
    "V25": "diagnostico.codigo_ips_confirmadora",
    "V26": "diagnostico.fecha_primera_consulta_tratante",
    "V27": "diagnostico.histologia",
    "V28": "diagnostico.grado_diferenciacion",
    "V29": "diagnostico.estadificacion_tnm",
    "V30": "diagnostico.fecha_estadificacion_tnm",
    "V31": "diagnostico.her2_realizado",
    "V32": "diagnostico.fecha_her2",
    "V33": "diagnostico.resultado_her2",
    "V34": "diagnostico.estadificacion_dukes",
    "V35": "diagnostico.fecha_dukes",
    "V36": "diagnostico.ann_arbor_lugano",
    "V37": "diagnostico.gleason",
    "V38": "diagnostico.clasificacion_riesgo",
    "V39": "diagnostico.fecha_clasificacion_riesgo",
    "V40": "diagnostico.objetivo_inicial",
    "V41": "diagnostico.objetivo_periodo",
    "V42": "diagnostico.antecedente_otro_cancer",
    "V43": "diagnostico.fecha_otro_cancer",
    "V44": "diagnostico.cie10_otro_cancer",
    "V45": "terapia_sistemica.recibio_qt",
    "V46": "terapia_sistemica.num_fases",
    "V47": "terapia_sistemica.num_ciclos",
    "V48": "terapia_sistemica.primer_esquema.ubicacion_temporal",
    "V49": "terapia_sistemica.primer_esquema.fecha_inicio",
    "V50": "terapia_sistemica.primer_esquema.num_ips",
    "V53": "terapia_sistemica.primer_esquema.num_medicamentos",
    "V58": "terapia_sistemica.primer_esquema.fecha_fin",
    "V59": "terapia_sistemica.primer_esquema.caracteristicas",
    "V60": "terapia_sistemica.primer_esquema.motivo_finalizacion",
    "V61": "terapia_sistemica.ultimo_esquema.ubicacion_temporal",
    "V62": "terapia_sistemica.ultimo_esquema.fecha_inicio",
    "V63": "terapia_sistemica.ultimo_esquema.num_ips",
    "V66": "terapia_sistemica.ultimo_esquema.num_medicamentos",
    "V71": "terapia_sistemica.ultimo_esquema.fecha_fin",
    "V72": "terapia_sistemica.ultimo_esquema.caracteristicas",
    "V73": "terapia_sistemica.ultimo_esquema.motivo_finalizacion",
    "V74": "cirugia.recibio_cirugia",
    "V75": "cirugia.num_cirugias",
    "V76": "cirugia.fecha_primera",
    "V77": "cirugia.ips_primera",
    "V78": "cirugia.cups_primera",
    "V79": "cirugia.ubicacion_primera",
    "V80": "cirugia.fecha_ultima",
    "V82": "cirugia.ips_ultima",
    "V83": "cirugia.cups_ultima",
    "V84": "cirugia.ubicacion_ultima",
    "V86": "radioterapia.recibio_rt",
    "V87": "radioterapia.num_sesiones",
    "V88": "radioterapia.primer_esquema.fecha_inicio",
    "V89": "radioterapia.primer_esquema.ubicacion_temporal",
    "V91": "radioterapia.primer_esquema.num_ips",
    "V94": "radioterapia.primer_esquema.fecha_fin",
    "V95": "radioterapia.primer_esquema.caracteristicas",
    "V96": "radioterapia.primer_esquema.motivo_finalizacion",
    "V97": "radioterapia.ultimo_esquema.fecha_inicio",
    "V98": "radioterapia.ultimo_esquema.ubicacion_temporal",
    "V103": "radioterapia.ultimo_esquema.fecha_fin",
    "V106": "trasplante.recibio_trasplante",
    "V107": "trasplante.tipo_trasplante",
    "V108": "trasplante.ubicacion_trasplante",
    "V109": "trasplante.fecha_trasplante",
    "V110": "trasplante.ips_trasplante",
    "V111": "cirugia_reconstructiva.recibio_cx_rec",
    "V112": "cirugia_reconstructiva.fecha_cx_rec",
    "V113": "cirugia_reconstructiva.ips_cx_rec",
    "V114": "cuidados_paliativos.valorado",
    "V115": "cuidados_paliativos.fecha_primera_atencion",
    "V116": "cuidados_paliativos.ips_paliativo",
    "V117": "soporte.psiquiatria",
    "V118": "soporte.fecha_psiquiatria",
    "V119": "soporte.ips_psiquiatria",
    "V120": "soporte.nutricion",
    "V121": "soporte.fecha_nutricion",
    "V122": "soporte.ips_nutricion",
    "V125": "resultado.estado_vital",
    "V126": "resultado.resultado_oncologico",
    "V128": "resultado.novedad_administrativa",
    "V129": "resultado.novedad_clinica",
    "V130": "resultado.fecha_desafiliacion",
    "V131": "resultado.fecha_muerte",
    "V132": "resultado.causa_muerte",
    "V133": "resultado.codigo_bdua",
    "V134": "resultado.fecha_bdua",
}


def get_path(vname: str) -> str:
    m = re.match(r"(V\d+)", vname.strip())
    if m:
        return VAR_MAP.get(m.group(1), m.group(1))
    return vname.strip()


# ─── Parser de catálogo CIE-10 (formato 2026) ─────────────────────────────

def _parse_cie10_2026(ruta: str) -> dict:
    """Lee el archivo CIE-10 2026 con columnas de género y edad."""
    df = pd.read_excel(ruta, header=1)
    df.columns = [
        'codigo', 'descripcion', 'agrupador', 'tipo_cancer',
        'observacion', 'revisar_genero', 'genero', 'revisar_edad', 'rango_edad'
    ]
    df = df[df['codigo'].notna()].copy()
    df['codigo']  = df['codigo'].str.strip()
    df['genero']  = df['genero'].fillna('').str.strip()

    return {
        'cie10_validos':       sorted(df['codigo'].tolist()),
        'cie10_solo_femenino': sorted(df[df['genero'] == 'Femenino']['codigo'].tolist()),
        'cie10_solo_masculino': sorted(df[df['genero'] == 'Masculino']['codigo'].tolist()),
        'cie10_descripcion':   dict(zip(df['codigo'], df['descripcion'].fillna(''))),
        'cie10_agrupador':     dict(zip(df['codigo'], df['agrupador'].fillna(''))),
    }


def _parse_cie10_legacy(df: pd.DataFrame) -> dict:
    """Lee el CIE-10 desde la hoja del Excel legacy (Reglas...)."""
    df.columns = ['codigo', 'descripcion', 'agrupador', 'tipo']
    df = df[df['codigo'].notna()].copy()
    df['codigo'] = df['codigo'].str.strip()
    cie10_validos = sorted(df['codigo'].tolist())
    return {
        'cie10_validos': cie10_validos,
        'cie10_solo_femenino': [],   # se extraen de las reglas
        'cie10_solo_masculino': [],
        'cie10_descripcion': dict(zip(df['codigo'], df['descripcion'].fillna(''))),
        'cie10_agrupador': dict(zip(df['codigo'], df['agrupador'].fillna(''))),
    }


# ─── Parser de catálogo ATC (formato 2026) ────────────────────────────────

def _parse_atc_2026(ruta: str) -> dict:
    df = pd.read_excel(ruta, header=2)
    df.columns = ['codigo', 'descripcion', 'observacion']
    df = df[df['codigo'].notna() & ~df['codigo'].astype(str).str.contains('CODIGOATC', na=False)].copy()
    df['codigo'] = df['codigo'].str.strip()
    return {
        'atc_validos': sorted(df['codigo'].tolist()),
        'atc_descripcion': dict(zip(df['codigo'], df['descripcion'].fillna(''))),
    }


# ─── Parser de catálogo CUPS (archivo completo Colombia) ─────────────────

def _parse_cups_colombia(ruta: str) -> dict:
    df = pd.read_excel(ruta, header=1)
    df.columns = [
        'Anexo', 'Codigo', 'CodPuntos', 'Descripcion_2024',
        'Trazabilidad', 'Anexo2', 'Codigo2', 'CodPuntos2', 'Descripcion_2025'
    ]
    mask = df['Codigo'].astype(str).str.match(r'^\d{6}$')
    df = df[mask].copy()
    df['Codigo'] = df['Codigo'].astype(str).str.strip()
    return {
        'cups_validos_full': sorted(df['Codigo'].tolist()),
        'cups_descripcion':  dict(zip(df['Codigo'], df['Descripcion_2025'].fillna(''))),
    }


# ─── Parser de reglas ─────────────────────────────────────────────────────

def _parse_reglas(df: pd.DataFrame) -> list:
    reglas = []
    for _, row in df.iterrows():
        desc = str(row.get("Descripción", "")).strip()
        cod  = str(row.get("Código de Error", "")).strip()
        tipo = str(row.get("Tipo de Error", "")).strip()
        yo   = str(row.get("Y/O", "")).strip()
        var  = str(row.get("No.VARIABLE", "")).strip()

        base = {
            "id": cod, "variable": var, "tipo_error": tipo,
            "operador_logico": yo, "descripcion_original": desc,
            "campo": None, "tipo_regla": None,
            "condicion": None, "restriccion": None,
            "nivel": "ERROR", "mensaje": None, "activa": True,
        }

        # Patrón 1: CONDICIONAL
        m = re.match(
            r"Cuando\s+(V\d+\w*)\s+sea\s+([=<>!]+)\s*(\S+)\s+Entonces\s+(V\d+[\w\s]*?)DEBE\s+SER\s+([=<>!]+)\s*(.+)",
            desc, re.IGNORECASE,
        )
        if m:
            cv, cop, cval, tv, top, tval = m.groups()
            tv_clean = re.match(r"(V\d+)", tv).group(1)
            base.update({
                "tipo_regla": "CONDICIONAL",
                "campo": get_path(tv_clean),
                "condicion": {"campo": get_path(cv), "operador": cop.strip(), "valor": cval.strip()},
                "restriccion": {"operador": top.strip(), "valor": tval.strip()},
                "mensaje": (
                    f"Cuando '{get_path(cv)}' {cop.strip()} '{cval.strip()}', "
                    f"el campo '{get_path(tv_clean)}' debe ser {top.strip()} '{tval.strip()}'."
                ),
            })
            reglas.append(base)
            continue

        # Patrón 2: SIMPLE
        m2 = re.match(r"(V\d+\w*)\s+DEBE\s+SER\s+([=<>!]+)\s*(.+)", desc, re.IGNORECASE)
        if m2:
            tv, top, tval = m2.groups()
            tv_clean = re.match(r"(V\d+)", tv).group(1)
            base.update({
                "tipo_regla": "SIMPLE",
                "campo": get_path(tv_clean),
                "restriccion": {"operador": top.strip(), "valor": tval.strip()},
                "mensaje": f"El campo '{get_path(tv_clean)}' debe ser {top.strip()} '{tval.strip()}'.",
            })
            reglas.append(base)
            continue

        base["tipo_regla"] = "NO_PARSEADA"
        reglas.append(base)
    return reglas


# ─── Función principal ────────────────────────────────────────────────────

def generar_desde_excel(
    ruta_excel: str,
    directorio_salida: str = None,
    ruta_cie10: str = None,
    ruta_atc: str = None,
    ruta_cups: str = None,
) -> dict:
    """
    Genera catalogos_excel.json y reglas.json.

    Modo legacy: solo ruta_excel (Excel con todas las hojas).
    Modo multi-archivo: ruta_excel contiene las reglas; los demás archivos
    provienen de ruta_cie10, ruta_atc, ruta_cups.
    """
    out_dir = Path(directorio_salida) if directorio_salida else Path(ruta_excel).parent / "app"
    out_dir.mkdir(parents=True, exist_ok=True)

    catalogos = {}

    # ── CIE-10 ──
    if ruta_cie10:
        print(f"  → CIE-10 desde: {Path(ruta_cie10).name}")
        catalogos.update(_parse_cie10_2026(ruta_cie10))
    else:
        print("  → Hoja CIE_10 del Excel principal...")
        cie_df = pd.read_excel(ruta_excel, sheet_name="CIE_10", header=0)
        catalogos.update(_parse_cie10_legacy(cie_df))

    # ── ATC ──
    if ruta_atc:
        print(f"  → ATC desde: {Path(ruta_atc).name}")
        catalogos.update(_parse_atc_2026(ruta_atc))
    else:
        print("  → Hoja ATC_MEDICAMENTOS del Excel principal...")
        atc_df = pd.read_excel(ruta_excel, sheet_name="ATC_MEDICAMENTOS", header=0)
        atc_df.columns = ['codigo', 'descripcion', 'concatenar']
        atc_df = atc_df[atc_df['codigo'].notna()].copy()
        catalogos['atc_validos'] = sorted(atc_df['codigo'].astype(str).str.strip().tolist())
        catalogos['atc_descripcion'] = dict(zip(
            atc_df['codigo'].astype(str).str.strip(),
            atc_df['descripcion'].fillna('')
        ))

    # ── CUPS ──
    if ruta_cups:
        print(f"  → CUPS desde: {Path(ruta_cups).name}")
        cups_data = _parse_cups_colombia(ruta_cups)
        # Para validación CAC usar solo los del catálogo previo + nuevos si existen
        existing_cat = out_dir / "catalogos_excel.json"
        if existing_cat.exists():
            existing = json.loads(existing_cat.read_text())
            cups_cac = sorted(set(existing.get('cups_validos', [])))
        else:
            cups_cac = []
        catalogos['cups_validos'] = cups_cac or cups_data['cups_validos_full']
        catalogos.update(cups_data)
    else:
        print("  → Hoja CUPS_CIRUGÍA del Excel principal...")
        cups_df = pd.read_excel(ruta_excel, sheet_name="CUPS_CIRUGÍA", header=0)
        catalogos['cups_validos'] = sorted(cups_df.iloc[:, 0].dropna().astype(str).str.strip().tolist())
        catalogos['cups_descripcion'] = {}

    # ── Reglas de coherencia ──
    print("  → Parseando reglas de coherencia...")
    reg_df = pd.read_excel(ruta_excel, sheet_name="Reglas", header=0)
    reg_df = reg_df[reg_df["No.VARIABLE"].notna()]

    # Sexo específico (solo si no viene del archivo CIE-10 2026 con datos de género)
    if not catalogos.get('cie10_solo_femenino'):
        mask_f = reg_df["Descripción"].str.match(
            r"Cuando V17 sea = \w+ Entonces V8Sexo DEBE SER = F", na=False)
        catalogos['cie10_solo_femenino'] = sorted(
            reg_df[mask_f]["Descripción"].str.extract(r"Cuando V17 sea = (\w+)")[0].tolist())
        mask_m = reg_df["Descripción"].str.match(
            r"Cuando V17 sea = \w+ Entonces V8Sexo DEBE SER = M", na=False)
        catalogos['cie10_solo_masculino'] = sorted(
            reg_df[mask_m]["Descripción"].str.extract(r"Cuando V17 sea = (\w+)")[0].tolist())

    reglas = _parse_reglas(reg_df)

    # ── Guardar ──
    cat_path = out_dir / "catalogos_excel.json"
    reg_path = out_dir / "reglas.json"

    with open(cat_path, "w", encoding="utf-8") as f:
        json.dump(catalogos, f, ensure_ascii=False, indent=2)
    with open(reg_path, "w", encoding="utf-8") as f:
        json.dump(reglas, f, ensure_ascii=False, indent=2)

    parseadas   = sum(1 for r in reglas if r["tipo_regla"] != "NO_PARSEADA")
    condicional = sum(1 for r in reglas if r["tipo_regla"] == "CONDICIONAL")
    simple      = sum(1 for r in reglas if r["tipo_regla"] == "SIMPLE")
    no_parse    = sum(1 for r in reglas if r["tipo_regla"] == "NO_PARSEADA")

    print(f"  ✅ {cat_path.name}: {len(catalogos['cie10_validos'])} CIE-10, "
          f"{len(catalogos['atc_validos'])} ATC, {len(catalogos['cups_validos'])} CUPS CAC")
    print(f"  ✅ {reg_path.name}: {parseadas} parseadas "
          f"({condicional} condicional, {simple} simple), {no_parse} sin parsear")

    return {
        "cie10_validos": len(catalogos['cie10_validos']),
        "cie10_solo_femenino": len(catalogos['cie10_solo_femenino']),
        "cie10_solo_masculino": len(catalogos['cie10_solo_masculino']),
        "atc_validos": len(catalogos['atc_validos']),
        "cups_validos_cac": len(catalogos['cups_validos']),
        "reglas_total": len(reglas),
        "reglas_parseadas": parseadas,
        "reglas_condicionales": condicional,
        "reglas_simples": simple,
        "reglas_no_parseadas": no_parse,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generador de catálogos CAC")
    parser.add_argument("excel", help="Excel de reglas (requerido siempre)")
    parser.add_argument("--cie10",  help="Archivo CIE-10 2026+")
    parser.add_argument("--atc",    help="Archivo ATC 2026+")
    parser.add_argument("--cups",   help="Archivo CUPS completo")
    parser.add_argument("--out",    help="Directorio de salida (default: app/)")
    args = parser.parse_args()

    print(f"📂 Excel reglas: {args.excel}")
    resumen = generar_desde_excel(
        args.excel,
        directorio_salida=args.out,
        ruta_cie10=args.cie10,
        ruta_atc=args.atc,
        ruta_cups=args.cups,
    )
    print("\n📊 Resumen:")
    for k, v in resumen.items():
        print(f"   {k}: {v}")
