# 🎯 GUÍA RÁPIDA - 7 PASOS PARA INICIAR

**Solo los pasos esenciales, sin complicaciones**

---

## ✅ PASO 1: Crear Cuenta Supabase (5 minutos)

```
1. Abre: https://supabase.com
2. Haz clic: "Sign Up"
3. Elige: Continuar con Google
4. Confirma tu email
```

**Pantalla esperada:**
```
┌────────────────────────────────────┐
│  ✅ Welcome to Supabase!           │
│     Create your first project      │
└────────────────────────────────────┘
```

---

## ✅ PASO 2: Crear Proyecto Supabase (5 minutos)

En Supabase, completa así:

```
Project Name:     cac-validador-v2
Database Password: MiContrasena123!
Region:           America del Sur
Pricing:          Free ✅
```

Presiona: **Create Project**

⏳ Espera 2-3 minutos...

---

## ✅ PASO 3: Obtener las Claves (2 minutos)

Cuando termina, ve a:

```
Settings (engranaje) → API
```

Verás:
```
Project URL:        https://xxxxx.supabase.co
ANON KEY:          eyJhbGc...
SERVICE ROLE KEY:  eyJhbGc...
```

📝 **Cópialas en Notepad** (guardalas en tu escritorio)

---

## ✅ PASO 4: Instalar Herramientas (10 minutos)

### A. Descargar Git
- Ve a: https://git-scm.com/download/win
- Descarga e instala
- Dale "Siguiente" a todo

### B. Descargar Node.js
- Ve a: https://nodejs.org
- Descarga versión **LTS**
- Instala, dale "Siguiente" a todo

### C. Reinicia tu computadora

---

## ✅ PASO 5: Descargar el Proyecto (5 minutos)

Abre **PowerShell** (Windows) o **Terminal** (Mac):

```bash
cd Desktop
git clone https://github.com/cac-validador/cac-validador.git
cd cac-validador\cac-validador-v2
```

---

## ✅ PASO 6: Configurar el Proyecto (5 minutos)

Instala las dependencias:

```bash
npm install
```

⏳ Espera 10 minutos (es la primera vez)

---

## ✅ PASO 7: Ejecutar y Abrir (3 minutos)

```bash
npm run dev
```

Abre tu navegador:
```
http://localhost:3000
```

🎉 **¡Deberías ver la app funcionando!**

---

## 🎨 Diagrama Visual del Flujo

```
1. Crear Cuenta Supabase
   │
   ↓ (5 min)
2. Crear Proyecto
   │
   ↓ (5 min)
3. Copiar Claves
   │
   ↓ (2 min)
4. Instalar Programas
   │
   ├─ Git
   ├─ Node.js
   └─ Reiniciar
   │
   ↓ (10 min)
5. Descargar Código
   │
   ↓ (5 min)
6. npm install
   │
   ↓ (10 min)
7. npm run dev
   │
   ↓ (3 min)
   🎉 APP LISTA EN http://localhost:3000
```

**Tiempo Total: ~45 minutos**

---

## 📱 Qué Verás Funcionando

Una vez que abras http://localhost:3000:

### Página de Inicio
```
╔════════════════════════════════════════╗
║  📊 CAC VALIDADOR v2.0                 ║
║                                        ║
║  Bienvenido a la plataforma de         ║
║  validación de cáncer                  ║
║                                        ║
║  [Botón: Ir a Dashboard]               ║
╚════════════════════════════════════════╝
```

### Dashboard Principal
```
╔════════════════════════════════════════╗
║  📤 Carga | 🔍 Validación | 📊 Reportes║
║                                        ║
║  [Sección: Carga de Archivos]         ║
║  - Drop zone para archivo TXT         ║
║  - Selector de período                ║
║  - Botón "Cargar"                     ║
╚════════════════════════════════════════╝
```

---

## 🔑 Las 3 Claves Que Necesitas

### 1. SUPABASE_URL
```
https://xxxxxxxxxxxxxxxx.supabase.co
```
⚠️ La ves en: Settings → Configuration

### 2. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
```
⚠️ La ves en: Settings → API

### 3. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
```
⚠️ La ves en: Settings → API (debajo de ANON_KEY)

---

## ✨ Características Que Funcionan

Una vez instalado, puedes:

✅ **Subir archivos TXT** de reportes CAC  
✅ **Validar automáticamente** contra 134 variables  
✅ **Ver errores en tiempo real**  
✅ **Descargar reportes**  
✅ **Historial de cargas**  
✅ **Estadísticas de calidad**  

---

## 🆘 Si Algo Falla

### ❌ "npm: comando no encontrado"
```
→ Node.js no instaló bien
→ Reinstala desde nodejs.org
→ Reinicia la computadora
```

### ❌ "Cannot connect to Supabase"
```
→ Las claves en .env.local son incorrectas
→ Cópialas de nuevo exacto
→ Sin espacios al inicio/final
```

### ❌ "Port 3000 is already in use"
```
→ Ya hay otra app usando ese puerto
→ Cierra otras aplicaciones
→ O pon otro puerto: npm run dev -- -p 3001
```

---

## 📞 Soporte Técnico

Si tienes problemas:

1. **Verifica los pasos** - Hazlos de nuevo en orden
2. **Googlea el error** - Cópialo y búscalo en Google
3. **Stack Overflow** - sitio de preguntas técnicas
4. **Comunidad GitHub** - Crea una issue en el proyecto

---

## 🚀 Próximos Pasos (Después de que funcione)

1. **Explorar el Dashboard** - Familiar izarte
2. **Subir archivo de prueba** - Ver cómo valida
3. **Revisar reportes** - Entender los errores
4. **Capacitarse** - Leer documentación CAC

---

## 💾 Archivo Importante: .env.local

Este archivo va en `cac-validador-v2/` y contiene:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXTAUTH_SECRET=tusecreto123
NODE_ENV=development
```

⚠️ **NUNCA lo compartas**  
⚠️ **NUNCA lo subas a internet**  
⚠️ **NUNCA lo mandes por email**  

---

## 🎯 Resumen

```
┌─────────────────────────────────────────┐
│ PARA EMPEZAR:                           │
├─────────────────────────────────────────┤
│ 1. Supabase (cuenta + proyecto + claves)│
│ 2. Git + Node.js                        │
│ 3. Descargar código                     │
│ 4. npm install                          │
│ 5. npm run dev                          │
│ 6. Abrir http://localhost:3000          │
│ 7. ¡Listo!                              │
└─────────────────────────────────────────┘

⏱️  Tiempo: ~45 minutos
💰 Costo: Gratis
🎓 Experiencia: No necesaria
✨ Resultado: App funcionando
```

---

**¿Preguntas? Lee la GUIA_IMPLEMENTACION_COMPLETA.md para más detalles**
