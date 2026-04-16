# 🚀 FASE 2 — VALIDACIÓN EN TIEMPO REAL + REPORTES

**Versión**: 2.0  
**Inicio**: 16 de abril de 2026  
**Duración Estimada**: 3-4 días  
**Estado**: 🟢 INICIANDO

---

## 📋 Objetivos Fase 2

### Objetivo Primario
Implementar el **motor de validación 100%** con todas las 134 variables y reglas cruzadas, integrado en API y dashboard.

### Objetivos Secundarios
1. Dashboard funcional para carga y visualización de validación
2. Reportes exportables (JSON, PDF, Excel)
3. Sistema caché de validaciones
4. Progress bar en tiempo real

---

## ✅ Entregables Esperados

| Componente | Estado | Prioridad |
|-----------|--------|-----------|
| Motor validación completo (134 vars) | 🟡 40% | 🔴 CRÍTICA |
| API validate/ completo | 🟡 40% | 🔴 CRÍTICA |
| Dashboard upload page | ❌ 0% | 🟠 ALTA |
| Dashboard validate page | ❌ 0% | 🟠 ALTA |
| Dashboard reports page | ❌ 0% | 🟠 ALTA |
| Export JSON | ✅ 90% | 🟡 MEDIA |
| Export PDF | ❌ 0% | 🟡 MEDIA |
| Export Excel | ❌ 0% | 🟡 MEDIA |
| Tests unitarios | 🟡 30% | 🟡 MEDIA |

---

## 📊 Breakdown Técnico

### SPRINT 1: Motor de Validación (Día 1-2)

#### 1. Completar lib/validations/engine.ts
```typescript
interface ValidationResult {
  esValido: boolean;
  errores: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
  timingMs: number;
}

interface ValidationError {
  variable: number;
  tipo: 'formato' | 'rango' | 'requerido' | 'cruce' | 'negocio';
  valor: any;
  mensaje: string;
  sugerencia?: string;
}
```

**Reglas a Implementar:**
- ✅ Validación básica (formato, rango)
- 🟡 Comodines de fecha (1800-01-01, 1845-01-01, 1846-01-01)
- ❌ Reglas cruzadas (V128 → V131, V132, etc)
- ❌ Reglas de negocio oncológico
- ❌ Búsqueda en catálogos (CIE-10, ATC, CUPS)

#### 2. Expandir lib/validations/rules/
Crear archivo por agrupación:
- `identification-rules.ts` (V1-V16)
- `diagnosis-rules.ts` (V17-V44)
- `therapy-rules.ts` (V45-V73)
- `surgery-rules.ts` (V74-V85)
- `radiotherapy-rules.ts` (V86-V105)
- `hematopoietic-rules.ts` (V106-V110)
- `complementary-rules.ts` (V111-V124)
- `status-rules.ts` (V125-V134)
- `cross-rules.ts` (Validaciones cruzadas)

#### 3. Tests unitarios
- `__tests__/engine.test.ts`
- `__tests__/comodines.test.ts`
- `__tests__/cross-rules.test.ts`

---

### SPRINT 2: Dashboard UI (Día 2-3)

#### Página: (dashboard)/upload/page.tsx
```
┌─────────────────────────────┐
│ 📤 Carga de Archivo CAC     │
├─────────────────────────────┤
│ Período de Corte: [2023-01-01] │
│                             │
│ [Drop Zone for TXT file]    │
│                             │
│ Validaciones:               │
│ ✓ Formato ANSI              │
│ ✓ Nombre archivo            │
│ ✓ 168 campos                │
│                             │
│ [Cargar] [Cancelar]         │
└─────────────────────────────┘
```

#### Página: (dashboard)/validate/page.tsx
```
┌────────────────────────────────┐
│ 🔍 Validación en Progreso      │
├────────────────────────────────┤
│ Reporte: ABC_2023_001.txt      │
│ Registros: 2,450              │
│                             │
│ Progreso: ▓▓▓▓▓░░░░░ 50%   │
│ Registros Válidos: 2,100 (86%) │
│ Errores: 350 (14%)          │
│                             │
│ Tasa: 180 reg/s             │
│ Tiempo estimado: 2.5s       │
│                             │
│ [Detalle de Errores]        │
│ Variable | Tipo | Cantidad   │
│ V128     | Cruce | 45       │
│ V17      | Rango | 32       │
│ ...                         │
│                             │
│ [Exportar] [Descargar]      │
└────────────────────────────────┘
```

#### Página: (dashboard)/reports/page.tsx
```
┌──────────────────────────────┐
│ 📊 Mis Reportes              │
├──────────────────────────────┤
│ [Filtro por período]         │
│                             │
│ Archivo | Período | Estado   │
│ ABC_001 | 2023-01 | ✅ Valid │
│ XYZ_002 | 2023-02 | ⏳ Validando │
│ DEF_003 | 2023-03 | ❌ Error │
│                             │
│ [Ver] [Descargar] [Eliminar] │
└──────────────────────────────┘
```

---

### SPRINT 3: API + Exportación (Día 3)

#### Mejorar API routes

**POST /api/validate**
- Input: registerData (134 variables)
- Output: { esValido, errores[], warnings[] }
- Caching: Redis/in-memory para reportes recientes

**POST /api/upload**
- Mejorar mapeo de 168 campos → 134 variables
- Transacción BD para inserción atómica
- Webhook para notificación de completación

**GET /api/export**
- Implementar export a Excel (XLSX con estilos)
- Implementar export a PDF (con charts de errores)

---

## 🎯 KPIs de Éxito Fase 2

| Métrica | Target | Status |
|---------|--------|--------|
| Cobertura reglas validación | 95% | 🟡 40% |
| Tiempo validación 500 registros | < 5s | ⏳ TBD |
| Disponibilidad API | 99.5% | 🟡 TBD |
| Dashboard UX score | > 8/10 | 🟡 TBD |
| Tests coverage | > 85% | 🟡 30% |

---

## 📅 Timeline Estimado

```
Día 1 (Hoy):
  09:00 - Completar motor validación base
  14:00 - Implementar 50% de reglas
  18:00 - Tests unitarios básicos

Día 2:
  09:00 - Implementar 100% de reglas
  14:00 - Dashboard upload + validate pages
  18:00 - API integration

Día 3:
  09:00 - Dashboard reports page
  14:00 - Export PDF/Excel
  18:00 - Testing e2e

Día 4 (Opcional):
  Optimizaciones, bug fixes, documentación
```

---

## 🔧 Stack de Desarrollo Fase 2

| Herramienta | Uso |
|-----------|-----|
| Zod | Validación schema |
| Zustand | Estado global (reporte en progreso) |
| TanStack Query v5 | Polling de estado validación |
| WebSocket (opcional) | Progress real-time |
| jsPDF | Generación PDF |
| XLSX | Generación Excel |
| Vitest | Tests unitarios |

---

## ⚠️ Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Validación muy lenta | Media | Alto | Optimizar con indexing + caching |
| Reglas cruzadas complejas | Media | Medio | Testing exhaustivo |
| Export PDF/Excel bugs | Baja | Bajo | Usar librerías probadas |
| RLS policies issues | Baja | Crítico | Testing en dev antes deploy |

---

## 📝 Notas Importantes

### Contexto Legal
- **V128** (Novedad Administrativa) es la variable crítica
- Comodines DEBEN diferenciarse por contexto
- Reglas de fallecimiento (V126, V128, V131, V132) CRÍTICAS

### Performance
- Batch validation: 100-500 registros por transacción
- Caché de catálogos (CIE-10, ATC, CUPS) en memoria
- Índices en BD: v06_numero_id, v17_cie10, reporte_id

### Próximo: FASE 3
- Integración IA (Gemma, Claude) para análisis de errores
- Webhook de notificación a CAC (SISCAC)
- Dashboard de auditoría

---

## ✨ Estado Inicial

**Completado en Fase 0+Ajustes:**
✅ Schema BD completo
✅ API routes base (validate, upload, export)
✅ Seed catálogos básicos
✅ RLS policies

**Para completar en Fase 2:**
❌ Motor validación 100%
❌ Dashboard completo
❌ Export PDF/Excel
❌ Tests e2e

**Próximo Paso:** Comenzar SPRINT 1 — Motor de Validación
