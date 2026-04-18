# app/validators/expansion.py
"""
Fase 2 del motor CAC: Expansión Estructural de Grupos Dinámicos.
================================================================
Antes de evaluar las 2.993 reglas del Excel, este módulo determina
qué campos son realmente validables en cada registro según sus
campos de control (V45, V46, V52, V65, V114).

Grupos dinámicos soportados:
  - V46.1–V46.8  : Fases de quimioterapia (hematolinfáticos)
  - V53.1–V53.9  : Medicamentos primer esquema
  - V54–V56      : Medicamentos adicionales primer esquema
  - V66.1–V66.9  : Medicamentos último esquema
  - V67–V69      : Medicamentos adicionales último esquema
  - V114.1–V114.6: Tipos de cuidado paliativo

REGLA CLAVE:
  Si un campo NO está en el conjunto "activos", el motor NO lo valida.
  Esto elimina los falsos positivos en registros con pocos medicamentos.
"""

from typing import Optional, Set

# ─── Definición declarativa de grupos dinámicos ───────────────────────────
GRUPOS_DINAMICOS = {
    "fases_qt": {
        "descripcion": "Fases de quimioterapia (solo hematolinfáticos)",
        "condicion_padre": ("terapia_sistemica.recibio_qt", "=", "1"),
        "subcondicion":    ("terapia_sistemica.num_fases", ">", "0"),
        "campo_control":   None,  # cada fase se activa individualmente (S/N)
        "campos": [
            "terapia_sistemica.fases.prefase",
            "terapia_sistemica.fases.induccion",
            "terapia_sistemica.fases.intensificacion",
            "terapia_sistemica.fases.consolidacion",
            "terapia_sistemica.fases.reinduccion",
            "terapia_sistemica.fases.mantenimiento",
            "terapia_sistemica.fases.mantenimiento_largo",
            "terapia_sistemica.fases.otra_fase",
        ],
        "variables": [f"V46.{i}" for i in range(1, 9)],
    },
    "medicamentos_primer": {
        "descripcion": "Medicamentos antineoplásicos – primer o único esquema",
        "condicion_padre": ("terapia_sistemica.recibio_qt", "=", "1"),
        "subcondicion":    None,
        # V53 = num_medicamentos controla cuántos med1..med9 aplican
        "campo_control":   "terapia_sistemica.primer_esquema.num_medicamentos",
        "campos": [
            f"terapia_sistemica.primer_esquema.med{i}" for i in range(1, 10)
        ],
        "variables": [f"V53.{i}" for i in range(1, 10)],
    },
    "medicamentos_primer_adicionales": {
        "descripcion": "Medicamentos adicionales primer esquema (V54–V56)",
        "condicion_padre": ("terapia_sistemica.recibio_qt", "=", "1"),
        "subcondicion":    None,
        "campo_control":   None,  # siempre activos si hay quimio
        "campos": [
            "terapia_sistemica.primer_esquema.med_adicional1",
            "terapia_sistemica.primer_esquema.med_adicional2",
            "terapia_sistemica.primer_esquema.med_adicional3",
        ],
        "variables": ["V54", "V55", "V56"],
    },
    "medicamentos_ultimo": {
        "descripcion": "Medicamentos antineoplásicos – último esquema",
        "condicion_padre": ("terapia_sistemica.recibio_qt", "=", "1"),
        "subcondicion":    None,
        # V66 = num_medicamentos controla cuántos med1..med9 aplican
        "campo_control":   "terapia_sistemica.ultimo_esquema.num_medicamentos",
        "campos": [
            f"terapia_sistemica.ultimo_esquema.med{i}" for i in range(1, 10)
        ],
        "variables": [f"V66.{i}" for i in range(1, 10)],
    },
    "medicamentos_ultimo_adicionales": {
        "descripcion": "Medicamentos adicionales último esquema (V67–V69)",
        "condicion_padre": ("terapia_sistemica.recibio_qt", "=", "1"),
        "subcondicion":    None,
        "campo_control":   None,
        "campos": [
            "terapia_sistemica.ultimo_esquema.med_adicional1",
            "terapia_sistemica.ultimo_esquema.med_adicional2",
            "terapia_sistemica.ultimo_esquema.med_adicional3",
        ],
        "variables": ["V67", "V68", "V69"],
    },
    "cuidados_paliativos": {
        "descripcion": "Tipos de profesional en cuidado paliativo (V114.1–V114.6)",
        "condicion_padre": ("cuidados_paliativos.valorado", "=", "1"),
        "subcondicion":    None,
        "campo_control":   None,  # todos activos si se valoró
        "campos": [
            "cuidados_paliativos.med_especialista_paliativo",
            "cuidados_paliativos.prof_salud_especialista_paliativo",
            "cuidados_paliativos.med_especialista_otra",
            "cuidados_paliativos.med_general",
            "cuidados_paliativos.trabajo_social",
            "cuidados_paliativos.otro_prof_no_especializado",
        ],
        "variables": [f"V114.{i}" for i in range(1, 7)],
    },
}


def _get(reporte_dict: dict, path: str) -> Optional[str]:
    """Navega un path 'a.b.c' en el dict del reporte. Retorna str o None."""
    obj = reporte_dict
    for parte in path.split("."):
        if not isinstance(obj, dict) or parte not in obj:
            return None
        obj = obj[parte]
    return str(obj).strip() if obj is not None else None


def expandir_campos_activos(reporte_dict: dict) -> Set[str]:
    """
    Determina qué paths JSON son validables para este registro.

    Retorna un set con todos los paths activos. El motor de reglas
    debe omitir cualquier campo que NO esté en este conjunto.

    Lógica por grupo:
      1. Verificar condición padre (ej: recibio_qt = 1)
      2. Verificar sub-condición si existe (ej: num_fases > 0)
      3. Si hay campo_control: activar solo N primeros campos
      4. Si no hay campo_control: activar todos los campos del grupo
    """
    activos: Set[str] = set()

    for grupo_id, cfg in GRUPOS_DINAMICOS.items():
        # ── Paso 1: condición padre ──
        cond_path, cond_op, cond_val = cfg["condicion_padre"]
        val_padre = _get(reporte_dict, cond_path)
        if val_padre != cond_val:
            continue  # grupo completo no aplica

        # ── Paso 2: sub-condición ──
        if cfg.get("subcondicion"):
            sc_path, sc_op, sc_val = cfg["subcondicion"]
            val_sc = _get(reporte_dict, sc_path)
            try:
                if sc_op == ">" and not (float(val_sc or 0) > float(sc_val)):
                    continue
                if sc_op == ">=" and not (float(val_sc or 0) >= float(sc_val)):
                    continue
            except (ValueError, TypeError):
                continue

        # ── Paso 3: determinar cuántos campos activar ──
        n_activos = len(cfg["campos"])  # default: todos
        if cfg.get("campo_control"):
            try:
                n_ctrl = int(_get(reporte_dict, cfg["campo_control"]) or 0)
                n_activos = min(max(n_ctrl, 0), len(cfg["campos"]))
            except (ValueError, TypeError):
                n_activos = 0

        # ── Paso 4: agregar campos activos ──
        for i, campo in enumerate(cfg["campos"]):
            if i < n_activos:
                activos.add(campo)

    return activos


def diagnosticar_grupos(reporte_dict: dict) -> dict:
    """
    Devuelve un resumen de qué grupos están activos y cuántos campos
    de cada uno aplican. Útil para debugging y logs.
    """
    resumen = {}
    for grupo_id, cfg in GRUPOS_DINAMICOS.items():
        cond_path, cond_op, cond_val = cfg["condicion_padre"]
        val_padre = _get(reporte_dict, cond_path)
        activo = val_padre == cond_val

        n_campos = 0
        if activo and cfg.get("campo_control"):
            try:
                n_campos = min(
                    int(_get(reporte_dict, cfg["campo_control"]) or 0),
                    len(cfg["campos"])
                )
            except (ValueError, TypeError):
                n_campos = 0
        elif activo:
            n_campos = len(cfg["campos"])

        resumen[grupo_id] = {
            "descripcion": cfg["descripcion"],
            "activo": activo,
            "campos_activos": n_campos,
            "total_campos": len(cfg["campos"]),
            "variables": cfg["variables"][:n_campos] if activo else [],
        }
    return resumen
