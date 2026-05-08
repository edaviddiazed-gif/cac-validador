# 🗺️ Hoja de Ruta: CAC Validador - Edición Local (Desktop App)

Dado que tanto el modelo en la nube (SaaS) como el modelo de escritorio (Local) tienen gran valor en el sector salud, la mejor estrategia es mantener un **Núcleo Compartido (Core)** y tener dos "envolturas" (Wrappers).

Esta hoja de ruta detalla cómo tomar el trabajo actual de Next.js y empaquetarlo en un `.exe` instalable sin perder el progreso.

## 🌟 Arquitectura Propuesta (Dual Mode)

- **Núcleo Compartido:** El motor de validación en TypeScript (`src/lib/validations/engine.ts`). Debe ser agnóstico (no debe saber si está en internet o en un PC).
- **Modo SaaS (Actual):** Next.js + API Routes + Supabase + Vercel.
- **Modo Local (Nuevo):** Next.js (Exportación Estática) + Tauri (Rust/Node) + SQLite local.

---

## 🛠️ FASE 1: Desacoplamiento del Motor (Semana 1)
Antes de empaquetar la app, debemos asegurarnos de que la lógica clínica no esté amarrada a la nube.

- [ ] **Aislar el Motor:** Asegurar que `engine.ts` no haga llamadas a `supabase` ni use APIs exclusivas de servidores web.
- [ ] **Abstracción de Catálogos:** Crear una interfaz para leer los catálogos de códigos (CIE10, Medicamentos) desde archivos JSON locales (como hace tu V1) en lugar de consultar una base de datos externa.
- [ ] **Manejo de Archivos Local:** Adaptar el parser para que reciba directamente la ruta física del archivo (`C:\Archivos\reporte.txt`) en lugar de esperar un upload a través del navegador, superando el límite de tamaño de memoria.

## 💾 FASE 2: Base de Datos Local - SQLite (Semana 2)
Las aplicaciones médicas locales necesitan guardar un historial sin usar internet.

- [ ] **Integrar SQLite:** Instalar y configurar `sqlite3` o `prisma` (modo local).
- [ ] **Migrar Esquema:** Replicar las tablas de Supabase (`reportes_cancer`, `registros`, `errores`) al esquema de SQLite.
- [ ] **Capa de Repositorio:** Crear funciones puente. Si la app detecta que está en "Modo Local", guarda los resultados en SQLite. Si está en "Modo Nube", guarda en Supabase.

## 🚀 FASE 3: Integración con Tauri (Semana 3)
Tauri es el framework moderno que reemplaza a Electron, creando ejecutables ultraligeros.

- [ ] **Instalar Tauri:** `npm install @tauri-apps/api @tauri-apps/cli`.
- [ ] **Configurar Next.js para Exportación Estática:** Ajustar `next.config.ts` para que genere archivos estáticos (`output: 'export'`), compatibles con apps de escritorio.
- [ ] **Puente UI-Sistema Operativo:** Reemplazar las descargas web de Excel/PDF por comandos nativos que guarden el archivo directamente en la carpeta "Documentos" del usuario.

## 🔒 FASE 4: Licenciamiento y Seguridad (Semana 4)
Al entregar un `.exe`, necesitas asegurarte de que solo clientes autorizados lo usen.

- [ ] **Generador de Licencias:** Crear un sistema simple de licencias (Serial Keys) basadas en el ID de hardware (MAC Address) del computador de la EPS.
- [ ] **Cifrado de Base de Datos:** Configurar la base de datos local (SQLite) con encriptación nativa (SQLCipher) para evitar que terceros lean o alteren los reportes directamente abriendo el archivo local.

## 📦 FASE 5: Empaquetado y Distribución (Semana 5)
- [ ] **Generación del Instalador:** Compilar el proyecto con Tauri para generar el `CAC_Validador_Setup.msi` o `.exe`.
- [ ] **Mecanismo de Auto-Actualización:** Configurar Tauri Updater. Cuando el Ministerio de Salud saque nuevas reglas, la app descarga un pequeño parche automáticamente la próxima vez que tenga internet, o permite cargar un archivo `.update` por USB para computadores sin red.

---

> **Veredicto:** Seguir esta ruta te permitirá tener el **mismo código base** sirviendo a dos mercados: Clínicas modernas que prefieren la nube (SaaS) y EPS/Hospitales tradicionales que exigen software instalado (Local).
