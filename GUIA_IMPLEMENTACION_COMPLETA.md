# 🚀 GUÍA COMPLETA: CÓMO PONER EN FUNCIONAMIENTO EL PROYECTO CAC VALIDADOR

**Para personas sin experiencia en programación**

---

## 📋 CONTENIDO

1. [Conceptos Básicos](#1-conceptos-básicos)
2. [Paso 1: Crear Cuenta Supabase](#paso-1-crear-cuenta-supabase)
3. [Paso 2: Configurar Supabase](#paso-2-configurar-supabase)
4. [Paso 3: Descargar Proyecto](#paso-3-descargar-proyecto)
5. [Paso 4: Instalar Herramientas](#paso-4-instalar-herramientas)
6. [Paso 5: Configurar Proyecto Localmente](#paso-5-configurar-proyecto-localmente)
7. [Paso 6: Ejecutar en Tu Computadora](#paso-6-ejecutar-en-tu-computadora)
8. [Paso 7: Deploy a Internet](#paso-7-deploy-a-internet)
9. [Mantenimiento](#mantenimiento)
10. [Solución de Problemas](#solución-de-problemas)

---

## 🎓 1. CONCEPTOS BÁSICOS

**No asustes**, aquí explicamos en simple qué significa cada cosa:

### ¿Qué es Supabase?
- **Supabase** = Almacenamiento de datos en la nube
- Es donde guardamos información de los reportes CAC
- Es gratuito para proyectos pequeños
- Alternativa a SQL Server que no requiere servidor propio

**Analógía**: Es como tener un Excel en la nube que puede consultar tu aplicación

### ¿Qué es Next.js?
- **Next.js** = Framework que hace la aplicación web funcione
- Ya está descargado en el proyecto
- Es lo que ves en el navegador (botones, formularios, etc.)

### ¿Qué es Git?
- **Git** = Sistema para versionar código (guardar cambios)
- Ya está configurado
- Lo usamos para descargar el proyecto

---

# PASO 1: CREAR CUENTA SUPABASE

## 1.1 Ir al Sitio Web

1. Abre tu navegador (Chrome, Firefox, Edge, etc.)
2. Ve a: **https://supabase.com**

```
┌────────────────────────────────────────┐
│         supabase.com                   │
│    [Botón: Start your project]         │
└────────────────────────────────────────┘
```

## 1.2 Registrarse (Crear Cuenta)

1. Haz clic en **"Sign up"** o **"Start your project"**
2. Elige una forma de registrarse:
   - ✅ **Google** (lo más fácil)
   - ✅ **GitHub** 
   - ✅ Email + Contraseña

**Recomendación**: Usa **Google** para que sea más fácil

### Pasos si usas Google:
1. Haz clic en **"Continue with Google"**
2. Selecciona tu cuenta Gmail
3. Confirma que aceptas los términos
4. ¡Listo! Ya tienes cuenta

---

# PASO 2: CONFIGURAR SUPABASE

## 2.1 Crear Nuevo Proyecto

Después de registrarse, verás una pantalla para crear proyecto:

```
┌─────────────────────────────────────┐
│  📊 Crear Nuevo Proyecto            │
├─────────────────────────────────────┤
│  Nombre Proyecto: [CAC Validador]   │
│  Región: [América del Sur]          │
│  [Botón: Create Project]            │
└─────────────────────────────────────┘
```

### Llena así:
- **Project name**: `cac-validador-v2`
- **Database password**: Pon una contraseña segura (ej: `Abc123!@#Supabase`)
- **Region**: Selecciona **América del Sur** o tu país
- Haz clic en **Create New Project**

> ⏳ Espera 2-3 minutos mientras se crea

---

## 2.2 Obtener las Claves (API Keys)

Cuando termine, verás un panel. Busca en el menú izquierdo:

```
Settings → API
```

Verás 2 claves importantes:

```
┌─────────────────────────────────────────┐
│  ANON KEY (Pública)                     │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ... │
├─────────────────────────────────────────┤
│  SERVICE ROLE KEY (Privada - Secreto)  │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ... │
└─────────────────────────────────────────┘
```

> 🔐 **IMPORTANTE**: Estas claves son como las contraseñas de tu banco. 
> - **ANON KEY**: Puedes compartir
> - **SERVICE ROLE KEY**: NUNCA compartas

### Cómo copiarlas
1. Haz clic en el botón **Copy** al lado de cada clave
2. Pégalas en un **Notepad** (bloc de notas de Windows)
3. Guarda ese archivo en lugar seguro

---

## 2.3 Obtener la URL de Supabase

En la misma pantalla de Settings → API, busca:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
```

Cópiala también.

---

## 2.4 Importar la Base de Datos

Ya hemos creado el esquema SQL. Ahora lo importamos:

1. En Supabase, ve a: **SQL Editor** (lado izquierdo)
2. Haz clic en **New Query**
3. Copia el contenido de: `supabase/migrations/001_initial_schema.sql`
4. Pégalo en el editor
5. Haz clic en **Run**

> ✅ Si ves texto verde = Éxito

---

# PASO 3: DESCARGAR PROYECTO

## 3.1 Instalación de Git

Git es necesario para descargar el proyecto.

### Windows:
1. Ve a: **https://git-scm.com/download/win**
2. Descarga el instalador
3. Abre el instalador y sigue los pasos (dale "Siguiente" a todo)
4. Al terminar, reinicia tu computadora

### Mac:
1. Abre **Terminal**
2. Pega esto:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew install git
   ```

### Linux:
```bash
sudo apt-get install git
```

---

## 3.2 Descargar el Proyecto

1. Abre **PowerShell** (Windows) o **Terminal** (Mac/Linux)

### En Windows:
- Presiona: `Windows + R`
- Escribe: `powershell`
- Presiona Enter

2. Copia y pega esto (reemplaza la ruta):

```bash
cd c:\Users\TU_USUARIO\Desktop
git clone https://github.com/TU_USUARIO/cac-validador.git
cd cac-validador\cac-validador-v2
```

> Esto descarga el proyecto en tu Escritorio

---

# PASO 4: INSTALAR HERRAMIENTAS

## 4.1 Instalación de Node.js

**Node.js** = Herramienta que ejecuta el proyecto

### Windows:
1. Ve a: **https://nodejs.org/**
2. Descarga la versión **LTS** (la recomendada)
3. Abre el instalador
4. Sigue todos los pasos (dale "Siguiente" a todo)
5. Reinicia tu computadora

### Mac/Linux:
```bash
# Mac con Homebrew
brew install node

# Linux
sudo apt-get install nodejs npm
```

---

## 4.2 Verificar Instalación

Abre PowerShell/Terminal y escribe:

```bash
node --version
npm --version
```

Deberías ver números como `v18.0.0` ✅

---

# PASO 5: CONFIGURAR PROYECTO LOCALMENTE

## 5.1 Instalar Dependencias

En la carpeta del proyecto, escribe:

```bash
npm install
```

> ⏳ Esto tarda 5-10 minutos. Es normal.

---

## 5.2 Crear Archivo de Configuración

En la carpeta `cac-validador-v2`, crea un archivo llamado:

```
.env.local
```

Abre este archivo con Notepad y pega:

```
# Supabase URLs
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Supabase Service Role (Secreto)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Claude API (Opcional para IA)
ANTHROPIC_API_KEY=sk-ant-...

# Auth Secret
NEXTAUTH_SECRET=tu_secret_muy_largo_aqui

# Ambiente
NODE_ENV=development
```

### Cómo llenarlo:

1. **SUPABASE_URL**: Pega la URL que copiaste antes
2. **SUPABASE_ANON_KEY**: Pega la clave ANON que copiaste
3. **SUPABASE_SERVICE_ROLE_KEY**: Pega la clave privada
4. **ANTHROPIC_API_KEY**: Opcional (para funciones IA después)
5. **NEXTAUTH_SECRET**: Pon cualquier texto largo:
   ```
   MySuper$ecret@Phrase2024!WithNumbers123
   ```

> 🔐 **IMPORTANTE**: Este archivo `.env.local` NO se sube a internet. Es solo local.

---

# PASO 6: EJECUTAR EN TU COMPUTADORA

## 6.1 Iniciar la Aplicación

En PowerShell/Terminal, en la carpeta del proyecto:

```bash
npm run dev
```

Verás algo como:

```
> cac-validador-v2@0.1.0 dev
> next dev

  ▲ Next.js 16.2.3
  - Local:        http://localhost:3000
  - Ready in: 2.5s
```

---

## 6.2 Abrir en el Navegador

1. Abre tu navegador (Chrome, Firefox, etc.)
2. Va a: **http://localhost:3000**

¡Deberías ver tu aplicación CAC Validador funcionando! 🎉

---

## 6.3 Detener la Aplicación

Para detener:
- Presiona: `Ctrl + C` en PowerShell/Terminal

---

# PASO 7: DEPLOY A INTERNET

Cuando la aplicación esté lista, puedes publicarla en internet.

## 7.1 Opción A: Vercel (Lo Más Fácil) ✅ RECOMENDADO

**Vercel** = Servicio para publicar aplicaciones Next.js gratis

### Pasos:

1. Ve a: **https://vercel.com**
2. Haz clic en **Sign Up**
3. Conecta con **GitHub** (debe tener tu proyecto allá)
4. Busca el proyecto `cac-validador`
5. Haz clic en **Import**
6. Agrega las variables de ambiente (copias de `.env.local`)
7. Haz clic en **Deploy**

> ✅ En 2-3 minutos tu app estará en internet

---

## 7.2 Opción B: Usar Supabase Hosting (Alternativa)

Supabase ofrece hosting limitado:

1. Ve a **Supabase → Settings → Integrations**
2. Conecta con **Vercel** (lo más fácil)
3. Sigue los pasos

---

# 🛠️ MANTENIMIENTO

## Tareas Regulares

### Semanal:
- Revisar logs de errores
- Hacer backup de datos

### Mensual:
- Actualizar dependencias: `npm update`
- Revisar cuota de Supabase

### Según sea necesario:
- Agregar nuevos catálogos CAC
- Ajustar reglas de validación

---

## Hacer Respaldos (Backups)

### Desde Supabase:

1. Supabase → Settings → Backups
2. Haz clic en **New backup**
3. Descárgalo a tu computadora

---

# ⚠️ SOLUCIÓN DE PROBLEMAS

## Error: "No se encuentra npm"

**Solución**: Node.js no está instalado correctamente
```bash
# Reinstala Node.js desde https://nodejs.org
# Después reinicia tu computadora
```

---

## Error: "La aplicación no carga en localhost:3000"

**Verificar**:
1. ¿Escribiste `npm run dev`?
2. ¿Estás en la carpeta correcta?
3. ¿Las dependencias se instalaron? (`npm install`)

**Solución**:
```bash
npm run dev
# Si no funciona:
npm install
npm run dev
```

---

## Error: "Cannot connect to Supabase"

**Causa**: Variables de ambiente incorrectas

**Solución**:
1. Abre `.env.local`
2. Verifica que las URLs y claves sean exactas
3. No debe haber espacios extra

---

## Error: "Database error"

**Causa**: El SQL no se ejecutó

**Solución**:
1. Ve a Supabase → SQL Editor
2. Ejecuta de nuevo el contenido de `001_initial_schema.sql`
3. Verifica que no haya errores rojos

---

## ¿Cómo obtener ayuda?

### Preguntas Frecuentes:
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Stack Overflow: https://stackoverflow.com

### Soporte:
- Supabase Support: https://supabase.com/support
- Comunidades GitHub Discussions

---

# 📊 RESUMEN DE ARCHIVOS IMPORTANTES

```
cac-validador-v2/
├── .env.local              ← Tus claves secretas (NO COMPARTIR)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    ← SQL para crear BD
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── upload/     ← Carga archivos
│   │   │   ├── validate/   ← Ver validación
│   │   │   └── reports/    ← Histórico
│   │   └── api/            ← Backend
│   └── lib/
│       └── validations/    ← Motor validación
├── package.json            ← Dependencias
└── next.config.ts          ← Configuración
```

---

# 🎯 CHECKLIST FINAL

Antes de publicar, verifica:

- [ ] Node.js instalado
- [ ] Git instalado
- [ ] Supabase cuenta creada
- [ ] Base de datos importada
- [ ] `.env.local` configurado
- [ ] `npm install` ejecutado
- [ ] `npm run dev` funciona
- [ ] Navegador muestra la app

---

# 💡 SIGUIENTES PASOS

Cuando todo esté funcionando:

1. **Fase 2 completa**: Motor validación 100%
2. **Fase 3**: Integración con IA (Claude)
3. **Fase 4**: Deployment a producción
4. **Fase 5**: Capacitación para usuarios finales

---

# 📞 PREGUNTAS FRECUENTES

## ¿Cuánto cuesta?

**Supabase**: Gratuito hasta 500MB datos  
**Vercel**: Gratuito para proyectos públicos  
**Total**: $0 en fase inicial

---

## ¿Qué información guardan?

Los datos de pacientes se guardan en Supabase (Colombia).  
Están protegidos por:
- Encriptación
- RLS (Row Level Security)
- Ley Habeas Data 1581/2012

---

## ¿Puedo usar esto en producción?

Sí, pero después de:
- Completar todas las fases
- Hacer testing exhaustivo
- Cumplir requisitos CAC/SISCAC

---

## ¿Cómo agrego más usuarios?

En la aplicación, ve a:
```
Settings → Users
+ New User
```

---

**¡Listo! Ya sabes cómo poner en funcionamiento el proyecto 🚀**

Cualquier duda, contacta al equipo de desarrollo.
