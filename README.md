# Validador CAC — Resolución 0247 de 2023

Sistema web completo para validar reportes de cáncer ante la Cuenta de Alto Costo (CAC) del Ministerio de Salud de Colombia, alineado con la **Resolución 0247 de 2023**.

---

## Estructura del proyecto

```
cac-validador/
├── backend/                    # FastAPI + Python
│   ├── app/
│   │   ├── main.py             # Endpoints FastAPI
│   │   ├── schemas/            # Modelos Pydantic (134 variables)
│   │   │   ├── cac.py          # Raíz: CACReport
│   │   │   ├── paciente.py     # V1–V16
│   │   │   ├── diagnostico.py  # V17–V44
│   │   │   ├── tratamientos.py # V45–V73
│   │   │   ├── procedimientos.py # V74–V105
│   │   │   ├── paliativos.py   # V106–V134
│   │   │   └── common.py       # ErrorDetalle, ValidationResponse
│   │   └── validators/
│   │       ├── base.py         # Formato + coherencia temporal
│   │       ├── clinicos.py     # Coherencia clínica por tipo tumor
│   │       └── __init__.py     # Orquestador
│   ├── requirements.txt
│   ├── sample_payload.json     # Caso real de prueba (mama, QT + CX)
│   └── Dockerfile
├── frontend/                   # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx             # Layout principal + navegación
│   │   ├── main.tsx
│   │   ├── types.ts            # Interfaces TypeScript
│   │   ├── catalogos.ts        # Todos los catálogos CAC
│   │   ├── initialState.ts     # Estado vacío del formulario
│   │   ├── components/
│   │   │   └── Field.tsx       # Campo, Selector, Grid, Alerta
│   │   └── pages/
│   │       ├── SecIdentificacion.tsx  # Sección 1
│   │       ├── SecDiagnostico.tsx     # Sección 2 (renderizado condicional)
│   │       ├── SecTratamientos.tsx    # Secciones 3, 4, 5
│   │       └── SecFinal.tsx           # Secciones 6, 7, 8
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
└── docker-compose.yml
```

---

## Inicio rápido

### Opción A — Docker (recomendado, sin instalar nada)

```bash
# 1. Clonar / descomprimir el proyecto
cd cac-validador

# 2. Levantar todo con un comando
docker-compose up --build

# Backend → http://localhost:8000
# Frontend → http://localhost:3000
# Docs API → http://localhost:8000/docs
```

### Opción B — Local sin Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                        # http://localhost:3000
```

---

## Uso del validador

### 1. Formulario web

Abrir `http://localhost:3000` en el navegador.

- Navegar por las **8 secciones** usando el panel izquierdo
- Cada campo muestra su número de variable (V18, V31, etc.) para trazabilidad con la RES 0247
- Los campos con renderizado condicional se muestran/ocultan automáticamente:
  - HER2 solo aparece si el CIE-10 es `C50.x` (mama)
  - Dukes solo si es `C18/C19/C20` (colorrectal)
  - Gleason solo si es `C61` (próstata)
  - Ann Arbor/Lugano si es linfoma/mieloma (`C81–C90`)
  - Fecha de muerte solo si el estado vital = `2` (fallecido)
  - Bloque de quimioterapia solo si `recibio_qt = 1`
- Clic en **▶ Validar Reporte** para enviar al backend
- El panel derecho muestra el resumen por sección con semáforo de errores
- Botón **⬇ Exportar JSON** descarga el payload del reporte

### 2. API directa

```bash
# Validar un reporte
curl -X POST http://localhost:8000/api/validar-cac \
  -H "Content-Type: application/json" \
  -d @backend/sample_payload.json

# Validación batch (múltiples reportes)
curl -X POST http://localhost:8000/api/validar-cac/batch \
  -H "Content-Type: application/json" \
  -d '[{...reporte1...}, {...reporte2...}]'

# Cargar Excel de reglas (admin)
curl -X POST http://localhost:8000/admin/cargar-reglas-excel \
  -F "archivo=@Reglas_Validacion_Cancer_2023_V01.xlsx" \
  --user cac_admin:Res247_2023!

# Documentación interactiva
open http://localhost:8000/docs
```

---

## Respuesta de la API

```json
{
  "valido": false,
  "total_errores": 2,
  "total_advertencias": 1,
  "errores_por_campo": {
    "diagnostico.her2_realizado": [
      {
        "id_regla": "R-030",
        "campo": "diagnostico.her2_realizado",
        "nivel": "ERROR",
        "mensaje": "Para cáncer de mama que no es in situ, debe registrar si se realizó la prueba HER2 (variable 31).",
        "variable_res": "V31"
      }
    ],
    "resultado.fecha_muerte": [
      {
        "id_regla": "R-040-A",
        "campo": "resultado.fecha_muerte",
        "nivel": "ERROR",
        "mensaje": "Si el usuario está fallecido, debe registrar la fecha de muerte (V129).",
        "variable_res": "V129"
      }
    ]
  },
  "errores_generales": [],
  "resumen_por_seccion": {
    "diagnostico": { "criticos": 1, "advertencias": 0 },
    "resultado":   { "criticos": 1, "advertencias": 1 }
  }
}
```

---

## Reglas de validación implementadas

| ID Regla | Variables | Tipo | Descripción |
|----------|-----------|------|-------------|
| OBL-V1…V42 | Múltiples | Obligatoriedad | 20 campos siempre obligatorios |
| FMT-V7…V129 | Fechas | Formato | AAAA-MM-DD o fecha especial válida |
| R-020 | V18 vs V7 | Temporal | Diagnóstico ≥ nacimiento |
| R-021 | V19 vs V20 | Temporal | Remisión ≤ ingreso IPS |
| R-022 | V23 vs V24 | Temporal | Muestra ≤ informe histo |
| R-023 | V49 vs V18 | Temporal | Inicio QT ≥ diagnóstico |
| R-024 | V58 vs V49 | Temporal | Fin QT ≥ inicio QT |
| R-025 | V76 vs V18 | Temporal | Cirugía ≥ diagnóstico |
| R-026 | V82 vs V76 | Temporal | Última CX ≥ primera CX |
| R-027 | V89 vs V18 | Temporal | RT ≥ diagnóstico |
| R-028 | V129 vs V7/V18 | Temporal | Muerte ≥ nacimiento y diagnóstico |
| R-030 | V17→V31 | Clínica | Mama → HER2 obligatorio |
| R-031 | V17→V34 | Clínica | Colorrectal → Dukes obligatorio |
| R-032 | V17→V37 | Clínica | Próstata → Gleason obligatorio |
| R-033 | V17→V36 | Clínica | Linfoma/mieloma → Ann Arbor |
| R-034 | V21=7→V22 | Dependencia | Sin histo → motivo obligatorio |
| R-035 | V45=1→V49 | Dependencia | QT=Sí → fecha inicio esquema |
| R-036 | V45=1→V51 | Dependencia | QT=Sí → IPS obligatoria |
| R-037 | V74=1→V78 | Dependencia | CX=Sí → CUPS obligatorio |
| R-038 | V87=1→V89 | Dependencia | RT=Sí → esquema obligatorio |
| R-040 | V125=2→V129/V130 | Dependencia | Fallecido → fecha + causa muerte |
| R-041 | V126=5→V128 | Dependencia | Desafiliado → fecha desafiliación |
| R-042 | V125≠2→V129 | Lógica | Vivo no debe tener fecha de muerte |
| R-050 | V21≠7→V22 | Lógica | Con histo → motivo debe ser 98 |
| R-051 | V21=7→V23 | Lógica | Sin histo → fecha muestra = 1845 |
| R-052 | V17 hematológico→V29 | Clínica | Hematolinfático → TNM = 98 |
| R-055 | V134 | Rango | Fecha BDUA fija = 2024-01-01 |
| R-060 | V18 vs fecha_corte | Advertencia | Diagnóstico no puede ser futuro |

---

## Códigos y fechas especiales

| Código | Significado |
|--------|-------------|
| `55` | Persona asegurada atendida por ente territorial |
| `98` | No aplica (según condición clínica) |
| `99` | Desconocido (no está en soportes clínicos) |
| `97` | No aplica — variante específica |
| `1800-01-01` | Fecha desconocida |
| `1845-01-01` | Fecha no aplica |
| `1846-01-01` | Ente territorial (equivalente a 55 en fechas) |
| `1840-01-01` | No aplica — cáncer mama in situ (HER2) |

---

## Agregar nuevas reglas de validación

Editar `backend/app/validators/clinicos.py` y agregar una función con el patrón:

```python
def validar_mi_nueva_regla(r: CACReport) -> List[ErrorDetalle]:
    errores = []
    if <condición>:
        _err(errores, "R-XXX", "campo.ruta", "Mensaje en español.", variable_res="VXX")
    return errores
```

Luego registrarla en `backend/app/validators/__init__.py`:

```python
todos.extend(validar_mi_nueva_regla(reporte))
```

---

## Credenciales admin por defecto

```
Usuario: cac_admin
Contraseña: Res247_2023!
```

Cambiar en `docker-compose.yml` → variables de entorno `ADMIN_USER` / `ADMIN_PASS`.
"# cac-validador"  
