# CHANGELOG — Motor de Validación CAC

## [2.0.0] — 2026-04-18 · Motor Corregido

### 🐛 Bugs corregidos

#### FIX-01 · Agrupamiento Y/O por `(id, campo)` — `motor_reglas.py`
**Problema:** El motor agrupaba reglas solo por `id` (código de error). Cuando
dos variables distintas compartían el mismo código, sus reglas se mezclaban en
un único grupo OR/AND, produciendo evaluaciones incorrectas.

**Solución:** La clave de agrupamiento cambió de `id` a `(id, campo)`.

```python
# ANTES
clave = r.get("id", "")

# DESPUÉS
clave = (r.get("id", ""), r.get("campo", ""))
```

---

#### FIX-02 · Expansión estructural de grupos dinámicos — `expansion.py` (NUEVO)
**Problema:** El motor validaba med4–med9 aunque `num_medicamentos` fuera 3,
generando falsos positivos. Los campos de cuidados paliativos (V114.1–V114.6)
nunca se desactivaban correctamente.

**Solución:** Nueva fase pre-motor que calcula los campos activos según
los campos de control (V45, V53, V66, V114). Solo los campos activos
se pasan al motor de reglas.

Grupos soportados:
- `fases_qt` — V46.1–V46.8 (hematolinfáticos)
- `medicamentos_primer` — V53.1–V53.9 controlado por V53
- `medicamentos_ultimo` — V66.1–V66.9 controlado por V66
- `cuidados_paliativos` — V114.1–V114.6 activados por V114=1

---

#### FIX-03 · Paths residuales `Vn.0` en DEFINICION — `generar_catalogos.py`
**Problema:** 4 reglas de tipo DEFINICION se escribían en reglas.json con
paths malformados (`"V1.0"`, `"V2.0"`, `"V3.0"`, `"V12.0"`) porque el
parser no resolvía estos casos via VAR_MAP. Nunca ejecutaban.

**Solución:** Nueva función `_normalizar_path()` aplicada a todo campo
generado por `get_path()`. Post-proceso adicional detecta y corrige
cualquier residual `Vn.0` antes de escribir el JSON.

---

#### FIX-04 · `V114` mapeada a `cuidados_paliativos.valorado` — `generar_catalogos.py`
**Problema:** `V114` debía ser la condición activadora del grupo de cuidados
paliativos, pero no estaba registrada en `VAR_MAP`, haciendo que la condición
padre de los 6 sub-campos (V114.1–V114.6) nunca se evaluara correctamente.

**Solución:** Agregada entrada `"V114": "cuidados_paliativos.valorado"` en
`VAR_MAP`. El grupo `cuidados_paliativos` en `expansion.py` usa este campo
como condición padre.

---

#### FIX-05 · `_resolver_variable` no crashea con None — `motor_reglas.py`
**Problema:** Si la referencia cruzada `V{n}` apuntaba a un campo vacío
o a un path no registrado en VAR_MAP, la función retornaba `None` pero
el motor continuaba comparando con el `None` crudo, causando errores en
comparaciones de fechas.

**Solución:** Lógica explícita: si `val_rest` era referencia V-number pero
el campo está vacío → omitir la regla (retornar True = sin error).

---

### ✨ Nuevas funciones

- `expansion.py` — `expandir_campos_activos(reporte_dict)` → `Set[str]`
- `expansion.py` — `diagnosticar_grupos(reporte_dict)` → `dict` (debug)
- `motor_reglas.py` — `ejecutar_motor_con_diagnostico(reporte_dict)` → `dict`
- `generar_catalogos.py` — `_normalizar_path(campo)` → `str`
- `generar_catalogos.py` — `GRUPOS_DINAMICOS_META` inyectado en `reglas.json._meta`

### 📋 Estructura de reglas.json actualizada

```json
{
  "_meta": {
    "version": "2.0-corregido",
    "total_reglas": 2993,
    "grupos_dinamicos": { ... },
    "fixes_aplicados": [ ... ]
  },
  "reglas": [ ... ]
}
```

### 🧪 Tests nuevos

- `tests/test_motor_cac.py` — 12 tests cubriendo:
  - Expansión sin QT (no activa medicamentos)
  - Expansión con N medicamentos (activa solo los primeros N)
  - Expansión con 9 medicamentos (activa todos)
  - Medicamentos primer y último esquema independientes
  - Cuidados paliativos sin/con valoración
  - Diagnóstico de grupos activos/inactivos

---

## Comandos para regenerar reglas.json después de actualizar el Excel

```bash
# Desde v1_legacy/backend/
python scripts/generar_catalogos.py ../../Reglas-Validacion-Cancer-2023-V01.xlsx
```

El nuevo `reglas.json` se escribirá en `app/reglas.json` con los 5 fixes aplicados.
