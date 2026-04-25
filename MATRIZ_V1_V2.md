# Matriz V1 vs V2

## Resumen Ejecutivo

La `v2` ya supera a `v1` en arquitectura, modularidad y base técnica, pero todavía no reemplaza completamente a `v1` a nivel funcional.

El estado más preciso hoy es:

- `v1` = producto más simple, pero más cerrado en captura manual end-to-end.
- `v2` = mejor plataforma, pero con varios flujos aún incompletos o parcialmente integrados.

## Matriz Comparativa

| Área | V1 | V2 actual | Qué falta en V2 | Prioridad |
|---|---|---|---|---|
| Arquitectura base | Frontend React + Vite y backend FastAPI separados | Next.js + Supabase + App Router + RLS + Edge Functions | Cerrar integración real de todos los módulos sobre esta arquitectura | Alta |
| Base de datos | Validación más orientada a API/backend legacy | Esquema Supabase amplio con `reportes_cancer`, `registros_cancer`, `errores_validacion`, `validation_jobs` | Verificar que todos los flujos de UI escriban/lean consistentemente de BD | Alta |
| Seguridad y multiusuario | Más básica | RLS, `user_profiles`, contexto por usuario/EAPB | Completar flujo real con `eapbId` derivado del usuario autenticado | Alta |
| Autenticación | Backend/API tradicional | Login con Supabase, middleware y contexto de headers | Definir y cerrar una sola estrategia; `next-auth` está instalado pero no implementado realmente | Alta |
| Carga de archivos TXT | Sí, en flujo legacy | Sí, con parser y API `/api/upload` | Quitar `eapbId: "placeholder"` y amarrarlo al usuario real | Crítica |
| Parser CAC | Base legacy útil | Parser TS con validaciones y tests | Integrarlo completamente con flujo productivo y exportación final | Alta |
| Validación por reglas | Motor Python legacy | Motor TS modular con reglas por rangos y reglas cruzadas | Usar ese motor robusto dentro del procesamiento batch/async real | Crítica |
| Validación batch asíncrona | Más limitada | `validation_jobs`, SSE, Edge Function | La Edge Function aún usa validación simplificada y no el motor completo | Crítica |
| Formularios manuales | 8 secciones funcionales en V1 | En V2 solo está viva la parte de Identificación | Construir Diagnóstico, Terapias, Cirugía, RT, Trasplante, Paliativos y Situación actual | Crítica |
| Navegación funcional | Flujo más directo y coherente para el alcance original | Hay varias rutas nuevas, pero algunas están a medio integrar | Consolidar rutas y eliminar duplicidad entre `/upload` y `/dashboard/upload` | Alta |
| Dashboard | Básico o inexistente como producto maduro | Sí hay dashboard visual y componentes de estado | Conectarlo solo a datos reales y quitar vistas demo/simuladas | Media |
| Reportes listados | No tan evolucionado | Página `/reports` con lectura desde API | Faltan rutas de detalle y eliminación que la UI ya intenta usar | Crítica |
| Detalle de reporte | V1 más centrado en validación directa | Hay vista de detalle bajo `dashboard/validate/[id]` | Alinear navegación y crear detalle real por reporte desde `/reports/{id}` o ajustar links | Alta |
| Eliminación de reportes | No identificado como feature fuerte en V1 | La UI intenta borrar reportes | Crear endpoint `DELETE /api/reportes/[id]` y validar permisos | Alta |
| Exportación TXT | V1 exportaba JSON/payload y validación | V2 tiene exportadores y endpoint central `/api/export` | Limpiar endpoint legacy `/api/export/txt` con TODOs y validar encoding final de punta a punta | Alta |
| Exportación PDF | No era diferencial fuerte | Implementación declarada en V2 | Confirmar dependencia real: `jspdf` se importa pero no está en `package.json` | Crítica |
| Exportación Excel | No tan madura en V1 | Implementada en V2 | Validar generación real y descarga con datos reales y storage | Alta |
| Storage/descargas | Más simple | Integración con Supabase Storage | Verificar buckets, signed URLs y permisos reales en ambiente | Alta |
| Catálogos | V1 tenía catálogos embebidos/legacy | V2 tiene endpoint `/api/catalogos/[tipo]` y seed | Quitar dependencia residual a `http://localhost:8000` en hooks | Alta |
| Dependencia backend Python | Total en V1 | Debería ser opcional o eliminable en V2 | Todavía hay pantallas y hooks apuntando a `localhost:8000` | Crítica |
| Coherencia técnica del stack | V1 coherente para su alcance | V2 mezcla plan, Supabase, Next 16, middleware legacy y restos Python | Depurar decisiones técnicas y dejar una sola línea arquitectónica | Alta |
| Compatibilidad con plan maestro | N/A | Parcial | El plan habla de Next 15, `ai-assistant`, auth cerrada y fases completas; el repo no refleja todo eso todavía | Media |
| IA asistente | No existía | Planificada en V2 | No existe `ai-assistant`, `api/ai` ni `lib/ai` productivos | Media |
| Testing unitario | Más orientado a backend legacy | Hay tests de parser y engine | Faltan tests E2E/integración para upload, validate, reportes y export | Alta |
| Build/producción | Más simple | Build de Next corre parcialmente | Resolver warnings/deprecaciones y dependencias faltantes antes de considerar release | Alta |

## Gaps Más Importantes

### 1. Validación real productiva

La `v2` ya tiene un motor TS mucho mejor, pero el procesamiento asíncrono todavía no depende claramente de ese motor completo. Esto es el gap más importante porque afecta el corazón del producto.

### 2. Entrada manual incompleta

`v1` tenía una experiencia manual más cerrada para capturar el reporte por secciones. En `v2`, esa experiencia quedó apenas iniciada.

### 3. Integración incompleta de reportes

La UI de reportes ya intenta listar, descargar, abrir detalle y eliminar, pero el backend no cubre todavía todas esas acciones de forma consistente.

### 4. Restos de arquitectura híbrida

Todavía hay piezas que dependen de `localhost:8000`, placeholders y simulaciones. Eso impide considerar a `v2` como una migración cerrada.

## Prioridad Recomendada de Trabajo

1. Unificar la validación batch/asíncrona con `src/lib/validations/engine.ts`.
2. Completar el flujo de upload con usuario real y `eapbId` real.
3. Cerrar reportes: detalle, eliminación y navegación consistente.
4. Completar la entrada manual sección por sección.
5. Eliminar dependencias residuales a FastAPI/`localhost:8000`.
6. Corregir exportación final y dependencias faltantes como `jspdf`.
7. Agregar pruebas de integración y hardening de build.

## Veredicto

La `v2` está más cerca de una plataforma escalable que `v1`, pero hoy sigue siendo una migración en progreso.

Si el objetivo es “reemplazar v1”, aún faltan:

- cierres funcionales,
- limpieza de integraciones temporales,
- y validación end-to-end de los flujos críticos.
