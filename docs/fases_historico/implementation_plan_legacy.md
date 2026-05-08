# Plan de Implementación: Alineación de Formularios Manuales V2 (Resolución 0247/2014 - 167 Variables)

Tras realizar un análisis exhaustivo del archivo `RES004_0274_2023.xlsx` y compararlo con el código actual del proyecto V2, se ha confirmado la desviación reportada:
- **Estado Actual:** Los formularios manuales en el frontend (`src/components/forms/*`) y la interfaz `CACRecord` (`cac.ts`) están basados en una estructura simplificada de **134 variables estáticas**, que no tiene en cuenta las múltiples sub-variables (e.g., las 8 fases de quimioterapia `46.1` a `46.8`, los 9 medicamentos `53.1` a `53.9`, o las sub-variables de cuidado paliativo `114.1` a `114.6`). 
- **Estado Requerido:** La resolución exige la captura de **167 variables/columnas** en total. El motor de reglas (`reglas_validacion_v2_corregido.json`) ya contempla estas 167 variables, pero la UI manual es actualmente "ilógica" porque no permite capturar estos datos con la granularidad correcta y asume la estructura antigua.

El objetivo de este plan es reestructurar completamente la captura manual para que haya paridad absoluta con lo que se construía en Excel.

> [!WARNING]
> **User Review Required**
> Este cambio impactará la estructura principal de datos del frontend (`CACRecord`). Si ya existen registros guardados en base de datos con el formato de 134 campos para pruebas, estos podrían quedar obsoletos o requerir migración.

## Proposed Changes

### Types & Interfaces
Se actualizará el contrato principal de datos del frontend.

#### [MODIFY] `cac.ts` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/types/cac.ts)
- Se expandirá la interfaz `CACRecord` para reemplazar la estructura actual de 134 campos por los **167 campos exactos** derivados del Excel.
- Se añadirán las sub-variables explícitamente (ej. `v46_1_prefase`, `v46_2_induccion`, `v53_1_med_antineoplasico`, etc.).
- Se actualizará el diccionario `VARIABLE_NAMES` para que incluya las 167 descripciones reales del archivo de Excel.

---

### Formularios Manuales (Frontend UI)
Se refactorizarán todos los componentes de la interfaz de captura manual para seguir fielmente la lógica de la resolución.

#### [MODIFY] `IdentificacionForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/IdentificacionForm.tsx)
- Validar y alinear variables 1 a 16.

#### [MODIFY] `DiagnosticoForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/DiagnosticoForm.tsx)
- Validar y alinear variables 17 a 44 (ej. corrección en lógica TNM, Gleason, Dukes, Ann Arbor).

#### [MODIFY] `TerapiaSistemicaForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/TerapiaSistemicaForm.tsx)
- **Reestructuración profunda:** Reemplazar el bloque genérico actual.
- Añadir sección para capturar las 8 fases de quimioterapia (variables `46.1` a `46.8`).
- Añadir captura detallada para los 9 medicamentos antineoplásicos del primer esquema (variables `53.1` a `53.9`).
- Añadir captura detallada para los 9 medicamentos del último esquema (variables `66.1` a `66.9`).
- Alinear preguntas de medicamentos adicionales (54-56 y 67-69) e intratecal (57 y 70).

#### [MODIFY] `CirugiaForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/CirugiaForm.tsx)
- Alinear variables 74 a 85 para que correspondan exactamente a lo exigido:
  - 74: Sometido a cirugía.
  - 75: Número de cirugías.
  - 76-79: Datos de la primera cirugía.
  - 80-85: Datos de la última cirugía/reintervención y estado vital.

#### [MODIFY] `RadioterapiaForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/RadioterapiaForm.tsx)
- Alinear variables 86 a 105. Asegurar captura de IPS1 e IPS2 para primer y último esquema (variables 92, 93, 101, 102).

#### [MODIFY] `TrasplanteForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/TrasplanteForm.tsx)
- Alinear variables 106 a 113. Incluir explícitamente Cirugía Reconstructiva y separar conceptualmente si es necesario, siguiendo estrictamente las variables 106-110 para Trasplante y 111-113 para Reconstructiva.

#### [MODIFY] `PaliativosForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/PaliativosForm.tsx)
- **Reestructuración profunda:** Alinear variables 114 a 124.
- Incluir obligatoriamente las sub-variables de la `114.1` a la `114.6` (Valoración por médico especialista, psiquiatría, general, trabajo social, etc.).
- Alinear consulta de nutrición, psiquiatría y rehabilitación según el orden del Excel.

#### [MODIFY] `ResultadoForm.tsx` (file:///c:/Users/Usuario/OneDrive/Escritorio/Proyecto%20CAC/cac-validador/cac-validador-v2/src/components/forms/ResultadoForm.tsx)
- Alinear variables 125 a 134 (Resultado final, estado vital, novedades, fecha de corte).

## Verification Plan

### Manual Verification
1. Ingresar a la aplicación frontend y navegar a la sección de "Captura Manual".
2. Comparar visualmente los campos de las pestañas (especialmente Terapia Sistémica y Paliativos) contra una plantilla vacía de `RES004_0274_2023.xlsx`.
3. Llenar un registro de prueba y confirmar que el JSON del estado global (Zustand) produzca exactamente 167 llaves que concuerden con las exigidas por el motor de reglas.
