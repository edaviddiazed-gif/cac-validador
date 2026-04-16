# Plan Maestro CAC Validador v2.0 - Referencia Rápida

## 📋 Información General
- **Proyecto**: CAC VALIDADOR v2.0
- **Propósito**: Sistema de Validación y Reporte de Cáncer para la Cuenta de Alto Costo
- **Marco Legal**: Resolución 0247/2014 (Ministerio de Salud Colombia)
- **Período de Medición**: 2023
- **Entidad**: Cuenta de Alto Costo (cuentadealtocosto.org)
- **Plazo Legal**: 5 de mayo de 2023
- **Versión Actual**: 2.0 (Abril 2026)

---

## 🏗️ Stack Tecnológico

```
Frontend:           Next.js 15 + App Router
Base de Datos:      Supabase (PostgreSQL)
UI Components:      shadcn/ui
Formularios:        React Hook Form + Zod
Estado Global:      Zustand + TanStack Query v5
Autenticación:      next-auth v5
IA:                 Gemma 4 + Claude
DevOps:             Vercel + GitHub Actions
```

---

## 📊 Variables CAC (134 Total)

### Agrupación por Secciones

| Rango | Sección | Descrición |
|-------|---------|-----------|
| V1-V16 | Identificación EAPB | Nombre, ID, fecha nacimiento, sexo, ocupación, régimen, municipio |
| V17-V44 | Diagnóstico | CIE-10, HER2, Gleason, TNM/FIGO, antecedentes |
| V45-V73 | Terapia Sistémica | Quimio, hormonoterapia, ATC, esquemas |
| V74-V85 | Cirugía | CUPS, IPS, fechas, estado vital |
| V86-V105 | Radioterapia | Primer/último esquema, técnicas |
| V106-V110 | Trasplante Hematopoyético | Procedimientos especializados |
| V111-V124 | Tratamiento Complementario | Reconstructiva, paliativo, nutrición, rehabilitación |
| V125-V134 | Situación Actual | Novedades, estado vital, fecha corte |

---

## ⚠️ Comodines Críticos (Especiales)

Estas fechas especiales NO son fechas reales, son códigos convencionales que el motor DEBE reconocer:

- **1800-01-01** = Desconocido
- **1845-01-01** = No Aplica
- **1846-01-01** = Ente Territorial

> ⚠️ **CRÍTICO**: El aplicativo SISCAC rechaza si no se tratan correctamente. NO se deben interpretar como fechas regulares.

---

## 🔗 Reglas Cruzadas Importantes

### Novedad Administrativa (V128)
La variable 128 controla la validación de múltiples campos:
- **Novedad 4** (fallecido) → REQUIERE V131 (fecha muerte) + V132 (causa)
- Otras novedades pueden hacer requeridas/opcionales otros campos

### Fecha de Diagnóstico (V18)
- DEBE coincidir con V24 cuando el diagnóstico es **histopatológico**
- Validación cruzada crítica

---

## 📁 Estructura de Carpetas

```
cac-validador-v2/
├── .claude/                 # Contexto para Claude Code
│   ├── CLAUDE.md           # Guía completa del dominio
│   ├── skills/             # Habilidades específicas
│   ├── agents/             # Agentes para tareas
│   └── rules/              # Reglas CAC específicas
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, autenticación
│   ├── (dashboard)/       # Panel principal
│   │   ├── upload/        # Carga de archivos TXT
│   │   ├── validate/      # Validación en tiempo real
│   │   ├── reports/       # Reportes y análisis
│   │   └── ai-assistant/  # Chat/asistencia IA
│   └── api/               # Endpoints REST
├── components/            # UI reutilizable
├── lib/
│   ├── validations/       # Motor de validación (134 vars)
│   ├── parsers/           # Parsers TXT ANSI
│   ├── exporters/         # Generadores PDF/Excel
│   └── ai/                # Integraciones IA
├── supabase/
│   ├── migrations/        # SQL init + schema
│   ├── functions/         # Edge Functions
│   └── seed.sql           # Datos catálogos
└── types/
    └── cac.ts             # TypeScript para 134 vars
```

---

## 🗄️ Tablas Supabase

### Tablas Principales

**eapb**
- Registro de EPS/Instituciones
- Campos: id, codigo, nombre, regimen

**reportes_cancer**
- Archivo subido + estado validación
- Campos: id, eapb_id, archivo, estado, total_registros, validated_at

**registros_cancer**
- Cada línea/paciente del reporte
- Campos: v01_v134 (134 columnas), raw_data (JSONB)

**errores_validacion**
- Detalle de errores por variable
- Campos: variable_numero, tipo_error, valor, sugerencia

### Tablas de Referencia
- **cie10_cac**: Diagnósticos válidos
- **atc_medicamentos**: Medicamentos autorizados
- **cups_procedimientos**: Procedimientos y cirugías
- **divipola_municipios**: Municipios colombianos

---

## 🔐 Seguridad (Row Level Security)

- **Principio**: Cada EAPB ve SOLO sus datos
- **Tablas con RLS**: reportes_cancer, registros_cancer
- **Autenticación**: next-auth v5 → Supabase Auth

---

## 📝 Formatos de Archivo

**Entrada (INPUT)**
- Formato: TXT ANSI
- Separador: Tabulaciones
- Codificación: ANSI (Latin-1)
- Estructura: Cabecera + N registros (pacientes)

**Salida (OUTPUT)**
- Reporte de validación (JSON, PDF, Excel)
- Detalles de errores por variable
- Sugerencias de corrección

---

## 🎯 Usuarios Objetivo

- **EAPB** (EPS - Entidades Promotoras de Salud)
- **Direcciones Departamentales de Salud**
- **Direcciones Distritales de Salud**
- **Usuarios administrativos/clínicos de instituciones**

---

## 📌 Restricciones de Desarrollo

✅ TypeScript estricto (strict: true)
✅ Máximo 200 líneas por archivo
✅ Naming: kebab-case archivos, PascalCase componentes
✅ Tests unitarios para validaciones
✅ No hardcodear secrets (.env.local)

---

## ⚡ Regla de Oro Claude Code

> Usar **Sonnet** para 90% del código.
> Usar **Opus** SOLO cuando:
> - Primer intento falló
> - Tarea > 5 archivos
> - Decisiones arquitectónicas
> - Código de seguridad crítica

Mantener < 10 MCPs simultáneamente activos.

---

## 📋 Checklist FASE 0

- [ ] Next.js 15 + App Router inicializado
- [ ] Supabase configurado + schema SQL
- [ ] CI/CD (GitHub Actions + Vercel)
- [ ] Claude Code + ECC configurado
- [ ] .claude/CLAUDE.md completado
- [ ] Tablas de referencia pobladas (CIE-10, ATC, CUPS, DIVIPOLA)
- [ ] RLS policies activas
- [ ] Tests unitarios base creados

