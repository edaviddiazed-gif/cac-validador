# CAC Validador v2.0 — Contexto del Proyecto

## Dominio

Sistema de **validación de reportes de cáncer** para la **Cuenta de Alto Costo (CAC)** de Colombia, basado en la **Resolución 0247/2014** del Ministerio de Salud.

- **Entidad**: Cuenta de Alto Costo — [cuentadealtocosto.org](https://cuentadealtocosto.org)
- **Usuarios**: EAPB (EPS), Direcciones Departamentales/Distritales de Salud
- **Datos**: Archivos TXT ANSI separados por tabulaciones, 134 variables en 168 campos
- **Plazo legal**: 5 mayo 2023 (medición corte 01/01/2023)

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Formularios | React Hook Form + Zod |
| Estado | Zustand + TanStack Query v5 |
| Backend DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth + NextAuth.js v5 |
| Archivos | Supabase Storage |
| IA Local | Gemma 4 vía Ollama API |
| IA Cloud | Claude API (Anthropic) |
| Deployment | Vercel + Supabase Cloud |

## Variables del Reporte (134 variables / 168 campos)

### V1-V16: Identificación EAPB y usuario
| # | Variable | Tipo | Descripción |
|---|----------|------|-------------|
| 1 | v01_primer_nombre | TEXT | Primer nombre del paciente |
| 2 | v02_segundo_nombre | TEXT | Segundo nombre |
| 3 | v03_primer_apellido | TEXT | Primer apellido |
| 4 | v04_segundo_apellido | TEXT | Segundo apellido |
| 5 | v05_tipo_id | VARCHAR(2) | Tipo documento: RC,TI,CC,CE,PA,MS,AS,CD,SC,PE |
| 6 | v06_numero_id | TEXT | Número de documento |
| 7 | v07_fecha_nacimiento | DATE | Fecha nacimiento AAAA-MM-DD |
| 8 | v08_sexo | CHAR(1) | M=Masculino, F=Femenino, I=Indeterminado |
| 9 | v09_ocupacion | VARCHAR(10) | Código CIUO ocupación |
| 10 | v10_regimen | CHAR(1) | C=Contributivo, S=Subsidiado, P=Excepción, E=Especial, N=No asegurado |
| 11 | v11_codigo_eapb | VARCHAR(10) | Código EAPB reportante |
| 12 | v12_pertenencia_etnica | INTEGER | 1-6 según clasificación |
| 13 | v13_grupo_poblacional | INTEGER | Grupo poblacional |
| 14 | v14_municipio_residencia | VARCHAR(5) | Código DIVIPOLA |
| 15 | v15_telefono | TEXT | Teléfono contacto |
| 16 | v16_fecha_afiliacion | DATE | Fecha afiliación a la EAPB |

### V17-V44: Diagnóstico y estadificación
| # | Variable | Tipo | Descripción |
|---|----------|------|-------------|
| 17 | v17_cie10 | VARCHAR(5) | Código CIE-10 del diagnóstico |
| 18 | v18_fecha_diagnostico | DATE | Fecha del diagnóstico confirmado |
| 19 | v19_medio_diagnostico | INTEGER | Medio por el que se diagnosticó |
| 20 | v20_topografia | VARCHAR(10) | Topografía del tumor |
| 21 | v21_base_diagnostico | INTEGER | Base del diagnóstico (1-10) |
| 22 | v22_grado_diferenciacion | INTEGER | Grado histológico |
| 23 | v23_lateralidad | INTEGER | 1=Der, 2=Izq, 3=Bilateral, 98=NA |
| 24 | v24_fecha_biopsia | DATE | Fecha de la biopsia |
| 25 | v25_ips_diagnostico | VARCHAR(20) | Código habilitación IPS diagnóstico |
| 26 | v26_municipio_ips_diagnostico | VARCHAR(5) | DIVIPOLA IPS diagnóstico |
| 27 | v27_histologia | INTEGER | Tipo histológico |
| 28 | v28_comportamiento | INTEGER | Comportamiento del tumor |
| 29 | v29_estadificacion | INTEGER | Estadio clínico (0-20+) |
| 30 | v30_clasificacion_tnm | TEXT | Clasificación TNM/FIGO |
| 31-36 | v31-v36 | Varios | HER2, RE, RP, Ki67 (solo mama C50x) |
| 37 | v37_gleason | INTEGER | Score Gleason (solo próstata C61) |
| 38-39 | v38-v39 | NUM/DATE | PSA valor y fecha |
| 40-44 | v40-v44 | INTEGER | Ann Arbor, síntomas B, IPSS, compromiso extranodal, LDH |

### V45-V73: Terapia sistémica
Incluye quimioterapia, hormonoterapia e inmunoterapia. V53 tiene sub-variables (53.1-53.8) para medicamentos ATC del primer esquema.

### V74-V85: Cirugía
Procedimientos quirúrgicos con códigos CUPS.

### V86-V105: Radioterapia
Primer y último esquema, incluye braquiterapia.

### V106-V110: Trasplante de células progenitoras hematopoyéticas

### V111-V124: Tratamiento complementario
Reconstructiva, paliativo, nutrición, psicología, rehabilitación.

### V125-V134: Situación actual y novedades
| # | Variable | Tipo | Descripción |
|---|----------|------|-------------|
| 125 | v125_ultimo_contacto | DATE | Fecha último contacto |
| 126 | v126_estado_vital | INTEGER | 1=Vivo, 2=Fallecido |
| 127 | v127_ecog | INTEGER | Performance status ECOG |
| 128 | v128_novedad_admin | INTEGER | **CRÍTICA**: determina lógica de validación |
| 129 | v129_novedad_clinica | INTEGER | Novedad clínica |
| 130 | v130_fecha_novedad | DATE | Fecha de la novedad |
| 131 | v131_fecha_muerte | DATE | Solo si V128=4 o V126=2 |
| 132 | v132_causa_muerte | INTEGER | Solo si V128=4 |
| 133 | v133_codigo_muerte | VARCHAR(5) | CIE-10 causa muerte |
| 134 | v134_fecha_corte | DATE | 2023-01-01 para medición 2023 |

## Reglas de Negocio Críticas

### Comodines de fecha
| Fecha | Significado | Cuándo usar |
|-------|-------------|-------------|
| `1800-01-01` | Desconocido | Dato no disponible |
| `1845-01-01` | No Aplica | Variable no aplica al caso |
| `1846-01-01` | Ente territorial | Reportado por ente territorial |

### Novedades Administrativas (V128) — CRÍTICA
V128 determina la lógica de validación de múltiples campos:
- **V128=2** (caso nuevo): V18 NO puede ser 1800-01-01
- **V128=4** (fallecido): Requiere V131 (fecha muerte) y V132 (causa) no comodín
- **V128=16**: Diferente de V128=3 (ver flujograma)

### Validaciones cruzadas prioritarias
1. V17↔V29: Si V17 empieza con 'D' → V29 debe ser 0
2. V18=V24: Cuando V21=5,9,10 (diagnóstico histopatológico)
3. V21=7: Requiere V22 ≠ 98
4. V45=98: Variables V46-V73 deben ser 98/97
5. V31-V33: Solo aplican si V17 es cáncer de mama (C50x)
6. V37: Solo aplica si V17 es cáncer de próstata (C61)
7. Medicamentos ATC en V53.x: no deben repetirse
8. V47 ciclos: coherentes con número de medicamentos

### Caracteres prohibidos
`& ñ á é í ó ú ü # ° ´` — Solo ASCII básico permitido

### Formato del archivo
- Encoding: ANSI (Windows-1252)
- Separador: tabulación (`\t`)
- Sin headers
- Nombre: `{AAAAMMDD}_{CODEAPB}_CANCER.txt`

## Convenciones de Código

- **TypeScript estricto** (`strict: true`)
- **kebab-case** para archivos, **PascalCase** para componentes
- **Máximo 200 líneas** por archivo
- **No hardcodear secrets**: usar `.env.local` con tipos seguros
- **Tests unitarios** para toda función de validación
- **JSDoc** en funciones públicas
- **Import alias**: `@/*` → `./src/*`

## Estructura del Proyecto

```
cac-validador-v2/
├── .claude/            # Contexto Claude Code
├── .github/workflows/  # CI/CD
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── (auth)/     # Rutas autenticación
│   │   ├── (dashboard)/ # Panel principal
│   │   └── api/        # API Routes
│   ├── components/     # Componentes reutilizables
│   ├── lib/
│   │   ├── validations/ # Motor de validación (134 vars)
│   │   ├── parsers/     # Parsers archivos TXT ANSI
│   │   ├── exporters/   # Exportadores PDF/Excel/TXT
│   │   └── ai/          # Clientes IA (Gemma + Claude)
│   └── types/           # Tipos TypeScript
├── supabase/
│   ├── migrations/      # Migraciones SQL
│   └── functions/       # Edge Functions
└── types/               # Tipos globales
```

## Roles de Usuario

| Rol | Acceso |
|-----|--------|
| admin_cac | Todas las EAPB, gestión total |
| admin_eapb | Su EAPB, CRUD completo |
| operador_eapb | Su EAPB, lectura + upload |
| auditor | Multi-EAPB, solo lectura |
| viewer | Su EAPB, solo lectura |
