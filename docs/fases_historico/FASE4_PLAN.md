# 📄 FASE 4 — EXPORTACIÓN Y GENERACIÓN DE REPORTES

**Versión**: 4.0  
**Inicio**: 16 de abril de 2026  
**Duración Estimada**: 4-6 días  
**Estado**: 🟢 INICIANDO

---

## 📋 Objetivos Fase 4

### Objetivo Primario
Implementar **exportación completa** en 3 formatos (TXT ANSI, PDF, Excel) para que usuarios descarguen reportes validados.

### Objetivos Secundarios
1. Archivo TXT ANSI válido para cargue en SISCAC
2. Reporte PDF ejecutivo con gráficos y estadísticas
3. Excel con múltiples hojas (resumen, errores, registros, recomendaciones)
4. Validación de archivos generados antes de permitir descarga

---

## ✅ Entregables Esperados

| Componente | Prioridad | Status |
|-----------|-----------|--------|
| lib/exporters/txt-exporter.ts | 🔴 CRÍTICA | ❌ 0% |
| lib/exporters/pdf-reporter.ts | 🔴 CRÍTICA | ❌ 0% |
| lib/exporters/excel-exporter.ts | 🔴 CRÍTICA | ❌ 0% |
| POST /api/export/txt | 🔴 CRÍTICA | ❌ 0% |
| POST /api/export/report (PDF) | 🟠 ALTA | ❌ 0% |
| POST /api/export/report (Excel) | 🟠 ALTA | ❌ 0% |
| Validación de archivos generados | 🟠 ALTA | ❌ 0% |
| Tests de exportadores | 🟡 MEDIA | ❌ 0% |

---

## 📊 Breakdown Técnico

### SPRINT 1: Exportador TXT ANSI (Día 1)

#### 1. lib/exporters/txt-exporter.ts
```typescript
/**
 * Exportar registros a formato TXT ANSI correcto para SISCAC
 * 
 * Especificación:
 * - Encoding: ANSI (Windows-1252), NO UTF-8
 * - Separador: tabulación (\t)
 * - Sin headers
 * - Sin caracteres especiales (ñ,á,é,í,ó,ú,ü,&,#,°)
 * - Sin espacios de relleno
 * - Formato: {AAAAMMDD}_{CODEAPB}_CANCER.txt
 * 
 * Uso:
 * const exporter = new TxtExporter();
 * const { fileContent, fileName } = await exporter.export(registros, eapbCode);
 * 
 * Validación:
 * - Re-parsearlo y verificar 0 errores
 * - Contar líneas: debe coincidir con registros
 */

interface ExportOptions {
  onlyValid?: boolean; // true = solo sin errores
  removeSpecialChars?: boolean; // true = reemplazar caracteres especiales
}

export class TxtExporter {
  // Implementación...
}
```

**Funciones**:
- `sanitizeValue(value)` — Remover caracteres especiales
- `convertToANSI(text)` — Convertir UTF-8 a ANSI (Windows-1252)
- `validateExport(content)` — Re-parsear y verificar integridad
- `generateFileName(eapbCode, date)` — Generar nombre {YYYYMMDD}_{CODE}_CANCER.txt

---

#### 2. POST /api/export/txt
```typescript
// Request
{
  reporteId: "uuid-123",
  onlyValid: false,
  format: "txt"
}

// Response
{
  success: true,
  fileName: "20260416_0001_CANCER.txt",
  fileSize: 2048576,
  downloadUrl: "https://signed-url...",
  message: "Archivo generado y validado correctamente"
}
```

**Implementación**:
- ✅ Obtener registros de Supabase
- ✅ Generar TXT con encoding ANSI
- ✅ Validar generado (re-parsearlo)
- ✅ Guardar en Supabase Storage
- ✅ Retornar signed URL (válida 1 hora)

---

### SPRINT 2: Reporte PDF (Día 2)

#### 1. lib/exporters/pdf-reporter.ts
```typescript
/**
 * Generar reporte PDF ejecutivo con jsPDF
 * 
 * Estructura:
 * - Portada: Logo CAC, EAPB, período, fecha
 * - Resumen ejecutivo: total registros, % calidad, comparativo
 * - Gráfico de barras: errores por sección
 * - Top 10 errores más frecuentes
 * - Tabla por variable: variable, errores, ejemplos
 * - Recomendaciones automáticas
 * - Pie de página con Resolución 0247/2014
 * 
 * Uso:
 * const reporter = new PdfReporter();
 * const pdfBytes = await reporter.generate(reporteData, estadísticas);
 */

interface ReporteData {
  eapbNombre: string;
  periodCorte: Date;
  totalRegistros: number;
  registrosValidos: number;
  registrosConError: number;
  errores: ValidationError[];
}

export class PdfReporter {
  // Implementación con jsPDF...
}
```

**Secciones PDF**:
1. **Portada** (1 página)
   - Logo CAC
   - Nombre EAPB
   - Período de corte
   - Fecha de generación

2. **Resumen Ejecutivo** (1 página)
   - KPIs principales (total, válidos, errores, %)
   - Tasa de calidad de datos
   - Comparativo con período anterior

3. **Análisis de Errores** (2-3 páginas)
   - Gráfico de barras: errores por sección (diagnóstico, terapia, cirugía, etc)
   - Top 10 errores más frecuentes
   - Tabla de errores por variable

4. **Recomendaciones** (1 página)
   - Automáticas basadas en patrones
   - Priorización por impacto

5. **Pie de página**
   - Resolución 0247/2014
   - Fecha de generación
   - Número de página

---

#### 2. POST /api/export/report?format=pdf
```typescript
// Request
{
  reporteId: "uuid-123",
  format: "pdf"
}

// Response (Streaming)
{
  success: true,
  fileName: "REPORTE_ABC_2023_01.pdf",
  downloadUrl: "https://signed-url...",
  generatedAt: "2026-04-16T10:30:00Z"
}
```

---

### SPRINT 3: Excel Avanzado (Día 2-3)

#### 1. lib/exporters/excel-exporter.ts
```typescript
/**
 * Generar Excel con múltiples hojas y estilos
 * 
 * Hojas:
 * 1. "Resumen" — Métricas generales con gráficos
 * 2. "Errores" — Lista plana de todos los errores (filtrable)
 * 3. "Por Variable" — Pivot de errores por número
 * 4. "Por Paciente" — Errores agrupados por DNI
 * 5. "Registros Válidos" — Listos para subir a SISCAC
 * 6. "Registros con Error" — Necesitan corrección
 * 
 * Colores:
 * - Errores críticos: rojo (#FFE0E0)
 * - Advertencias: amarillo (#FFFACD)
 * - Correctos: verde (#E0FFE0)
 * 
 * Uso:
 * const exporter = new ExcelExporter();
 * const excelBytes = await exporter.generate(reporteData);
 */

export class ExcelExporter {
  // Implementación con SheetJS...
}
```

**Hojas Excel**:

1. **Resumen** (Hoja 1)
   ```
   Métrica                    | Valor
   ───────────────────────────┼──────
   Total Registros            | 2,450
   Registros Válidos          | 2,100 (86%)
   Registros con Error        | 350 (14%)
   Tasa de Calidad            | 86%
   
   [Gráfico de Barras]
   [Gráfico de Pie]
   ```

2. **Errores** (Hoja 2)
   ```
   Registro | Variable | Tipo Error  | Valor        | Mensaje
   ─────────┼──────────┼─────────────┼──────────────┼─────────
   1        | 128      | cruce       | 4            | V128=4 requiere V131
   2        | 17       | rango       | C99          | CIE-10 no válido
   ...
   ```

3. **Por Variable** (Hoja 3 - Pivot)
   ```
   Variable | Nombre             | Total Errores | %
   ─────────┼────────────────────┼───────────────┼────
   128      | Novedad Admin      | 45            | 12.8%
   17       | CIE-10             | 32            | 9.1%
   ...
   ```

4. **Por Paciente** (Hoja 4)
   ```
   DNI        | Nombre    | Variables con Error | Errores
   ───────────┼───────────┼────────────────────┼────────
   1234567890 | Juan Pérez| 2                  | V128, V17
   ...
   ```

5. **Registros Válidos** (Hoja 5)
   ```
   [Todos los 168 campos de registros sin error]
   [Fondo verde]
   ```

6. **Registros con Error** (Hoja 6)
   ```
   [Todos los 168 campos de registros con error]
   [Fondo rojo]
   ```

---

### SPRINT 4: API Integration (Día 3)

#### 1. POST /api/export/report (Unificado)
```typescript
// Maneja tanto PDF como Excel

// Request
{
  reporteId: "uuid-123",
  format: "pdf" | "excel"
}

// Response
{
  success: true,
  fileName: "REPORTE_...",
  downloadUrl: "https://signed-url...",
  fileSize: 2048576,
  generatedAt: "2026-04-16T10:30:00Z"
}
```

**Implementación**:
- ✅ Validar acceso EAPB
- ✅ Obtener datos de Supabase
- ✅ Generar en formato solicitado
- ✅ Guardar en Storage
- ✅ Retornar signed URL

---

#### 2. GET /api/export/status
```typescript
// Obtener historial de exportaciones del reporte

// Request
{
  reporteId: "uuid-123"
}

// Response
{
  success: true,
  exports: [
    {
      id: "export-123",
      format: "txt",
      fileName: "20260416_0001_CANCER.txt",
      fileSize: 2048576,
      createdAt: "2026-04-16T10:30:00Z",
      downloadUrl: "..."
    },
    ...
  ]
}
```

---

## 📦 Dependencias Necesarias

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "xlsx": "^0.18.5",
    "iconv-lite": "^0.6.3"
  }
}
```

**Instalación**:
```bash
npm install jspdf html2canvas xlsx iconv-lite
```

---

## 🎯 KPIs de Éxito Fase 4

| Métrica | Target | Status |
|---------|--------|--------|
| Exportador TXT funciona | 100% | 🟡 0% |
| Archivo TXT re-validable | 100% | 🟡 0% |
| PDF genera sin errores | 100% | 🟡 0% |
| Excel con 6 hojas | 100% | 🟡 0% |
| Signed URLs funcionan | 100% | 🟡 0% |
| Tests de exportadores | 85% | 🟡 0% |

---

## 📅 Timeline Estimado

```
Día 1:
  09:00 - Implementar txt-exporter.ts
  11:00 - POST /api/export/txt
  14:00 - Tests de exportador TXT
  18:00 - Validación de archivo generado

Día 2:
  09:00 - Implementar pdf-reporter.ts
  11:00 - POST /api/export/report (PDF)
  14:00 - Tests de PDF
  18:00 - Integración en dashboard

Día 3:
  09:00 - Implementar excel-exporter.ts
  11:00 - POST /api/export/report (Excel)
  14:00 - Tests de Excel
  18:00 - UI de descarga en dashboard

Día 4:
  09:00 - GET /api/export/status
  11:00 - Historial de exportaciones
  14:00 - Tests E2E
  18:00 - Polish y documentación
```

---

## 🔗 Tareas Iniciales Inmediatas

### ✅ Sprint 1 - TXT ANSI:
```
[ ] 1. Crear lib/exporters/txt-exporter.ts
[ ] 2. Función sanitizeValue() para caracteres especiales
[ ] 3. Función convertToANSI() con iconv-lite
[ ] 4. Función validateExport() para re-parsearlo
[ ] 5. POST /api/export/txt integrado
[ ] 6. Tests unitarios para TXT exporter
```

### ⏳ Sprint 2 - PDF:
```
[ ] 7. Crear lib/exporters/pdf-reporter.ts
[ ] 8. Implementar portada y resumen ejecutivo
[ ] 9. Implementar gráficos con jsPDF
[ ] 10. POST /api/export/report?format=pdf
[ ] 11. Tests de PDF
```

### ⏳ Sprint 3 - Excel:
```
[ ] 12. Crear lib/exporters/excel-exporter.ts
[ ] 13. Hoja 1: Resumen con gráficos
[ ] 14. Hojas 2-6: Errores, variables, pacientes, registros
[ ] 15. POST /api/export/report?format=excel
[ ] 16. Tests de Excel
```

### ⏳ Sprint 4 - Integration:
```
[ ] 17. GET /api/export/status
[ ] 18. UI de descargas en dashboard/reports
[ ] 19. Tests E2E exportación completa
[ ] 20. Documentación final
```

---

## 🏗️ Estructura de Carpetas

```
src/lib/exporters/
├── txt-exporter.ts
├── pdf-reporter.ts
├── excel-exporter.ts
└── __tests__/
    ├── txt-exporter.test.ts
    ├── pdf-reporter.test.ts
    └── excel-exporter.test.ts

src/app/api/export/
├── route.ts (GET exportaciones + POST nuevo)
├── txt/
│   └── route.ts (POST /api/export/txt)
└── report/
    └── route.ts (POST /api/export/report?format=pdf|excel)
```

---

## 📊 Formato TXT ANSI — Especificación

**Resolución 0247/2014 (CAC)**

```
ARCHIVO: {YYYYMMDD}_{CODEAPB}_CANCER.txt

FORMATO:
- Encoding: Windows-1252 (ANSI), NO UTF-8
- Separador: Tabulación (\t)
- Salto línea: \n (Unix)
- Sin headers
- 168 campos por línea (V01 a V168)
- 134 variables (algunos campos son grupos)

VALIDACIONES:
- Sin caracteres especiales: ñ,á,é,í,ó,ú,ü,&,#,°,´
- Sin espacios de relleno
- Longitudes exactas por campo
- Tipos de dato validados

EJEMPLO LÍNEA:
Juan\tPérez\tGómez\t...C50\t2023-01-15\t...\n
```

---

## 🚀 Próximo: FASE 5
**Modelo de Negocio**: Autenticación mejorada, roles, planes de suscripción, facturación.

---

## 📞 REFERENCIAS

- [FASE3_PLAN.md](FASE3_PLAN.md) — Fase anterior (API + Autenticación)
- [plan_maestro.json](plan_maestro.json) — Plan general del proyecto
- [Resolución 0247/2014](https://www.cuentadealtocosto.org/) — Especificación CAC
