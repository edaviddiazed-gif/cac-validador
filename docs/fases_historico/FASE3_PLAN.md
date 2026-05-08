# 🔐 FASE 3 — API, AUTENTICACIÓN Y SEGURIDAD

**Versión**: 3.0  
**Inicio**: 16 de abril de 2026  
**Duración Estimada**: 5-7 días  
**Estado**: 🟢 INICIANDO

---

## 📋 Objetivos Fase 3

### Objetivo Primario
Implementar **API Routes seguras** con autenticación JWT y autorización por rol, integradas con el dashboard.

### Objetivos Secundarios
1. Supabase Edge Functions para validación asincrónica
2. Sistema de seguridad multi-capas (middleware, RLS, rate limiting)
3. Auditoría completa de acciones sensibles
4. Variables de entorno type-safe

---

## ✅ Entregables Esperados

| Componente | Prioridad | Status |
|-----------|-----------|--------|
| POST /api/validate | 🔴 CRÍTICA | ❌ 0% |
| GET /api/validate/[jobId]/status | 🔴 CRÍTICA | ❌ 0% |
| POST /api/export/txt | 🟠 ALTA | ❌ 0% |
| POST /api/export/report | 🟠 ALTA | ❌ 0% |
| GET /api/catalogos/[tipo] | 🟠 ALTA | ❌ 0% |
| Edge Function: validate-cac | 🔴 CRÍTICA | 🟡 10% |
| Middleware autenticación JWT | 🔴 CRÍTICA | ❌ 0% |
| Rate limiting por EAPB | 🔴 CRÍTICA | 🟡 50% |
| RLS Policies avanzadas | 🔴 CRÍTICA | ✅ 90% |
| Audit log con trigger | 🟠 ALTA | ❌ 0% |
| .env.local.example (type-safe) | 🟡 MEDIA | ❌ 0% |
| Integración Dashboard → APIs | 🔴 CRÍTICA | ❌ 0% |

---

## 📊 Breakdown Técnico

### SPRINT 1: API Routes (Día 1-2)

#### 1. POST /api/validate
```typescript
// Request
{
  reporteId: "uuid-123",
  // Optional: re-validate existing report
}

// Response
{
  success: true,
  jobId: "job-456",
  estimatedTime: 15, // segundos
}

// Error
{
  success: false,
  error: "Reporte no encontrado" | "No autorizado"
}
```

**Implementación:**
- ✅ Verificar autenticación JWT
- ✅ Validar que EAPB tiene acceso al reporte
- ✅ Crear job en tabla `validation_jobs`
- ✅ Triggerear Edge Function async
- ✅ Retornar jobId para polling

---

#### 2. GET /api/validate/[jobId]/status
```typescript
// Server-Sent Events (SSE)
data: {
  "processed": 1250,
  "total": 2450,
  "percentage": 51,
  "currentState": "validando",
  "elapsedSeconds": 8,
  "estimatedSecondsRemaining": 8
}

// Final Response
{
  "status": "completado",
  "totalRegistros": 2450,
  "registrosValidos": 2100,
  "registrosConError": 350,
  "erroresAgrupados": {
    "formato": 150,
    "rango": 120,
    "cruce": 80
  }
}
```

**Implementación:**
- ✅ SSE para polling en tiempo real
- ✅ Leer tabla `validation_jobs` y actualizar progreso
- ✅ Auto-actualizar cada 500ms
- ✅ Cerrar conexión cuando status = "completado"

---

#### 3. POST /api/export/txt
```typescript
// Request
{
  reporteId: "uuid-123",
  onlyValid: false, // true = solo registros sin errores
}

// Response
{
  success: true,
  fileSize: 2048576,
  fileName: "20260416_0001_CANCER.txt",
  downloadUrl: "..." // Signed URL
}
```

**Implementación:**
- ✅ Generar TXT ANSI con encoding Windows-1252
- ✅ Validar archivo generado (re-parsearlo)
- ✅ Guardar en Supabase Storage
- ✅ Retornar signed URL (válida 1 hora)

---

#### 4. POST /api/export/report
```typescript
// Request
{
  reporteId: "uuid-123",
  format: "pdf" | "excel", // xlsx
}

// Response
{
  success: true,
  downloadUrl: "..." // Signed URL
}
```

**Implementación:**
- ✅ Generar PDF con jsPDF (gráficos, tablas)
- ✅ Generar Excel con múltiples hojas
- ✅ Guardar en Storage
- ✅ Retornar signed URL

---

#### 5. GET /api/catalogos/[tipo]
```typescript
// URLs
GET /api/catalogos/cie10?q=cancer&limit=10
GET /api/catalogos/atc?q=quimio&limit=10
GET /api/catalogos/cups?q=cirugia&limit=10
GET /api/catalogos/divipola?q=bogota&limit=10
GET /api/catalogos/ips?q=hospital&limit=10

// Response
{
  success: true,
  data: [
    { codigo: "C50", descripcion: "Tumor maligno de mama" },
    ...
  ]
}
```

**Implementación:**
- ✅ Buscar en tablas de referencia
- ✅ Cache de 24h (Next.js revalidate)
- ✅ Autocomplete para UI
- ✅ Máximo 50 resultados

---

### SPRINT 2: Autenticación y Seguridad (Día 2-3)

#### 1. Middleware JWT
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const publicPaths = ['/auth', '/login', '/api/auth'];
  
  if (publicPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }
  
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return NextResponse.redirect('/auth/login');
  
  // Verificar token Supabase
  const user = await verifyToken(token);
  if (!user) return NextResponse.redirect('/auth/login');
  
  // Pasar user al request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);
  
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
};
```

---

#### 2. Rate Limiting
```typescript
// Tabla en Supabase
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY,
  eapb_id UUID NOT NULL,
  endpoint VARCHAR(100),
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

// Implementación
async function checkRateLimit(eapbId: string) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const { data } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('eapb_id', eapbId)
    .eq('endpoint', '/api/upload')
    .gte('window_start', oneHourAgo);
  
  if (data?.[0]?.request_count >= 10) {
    return { success: false, reset: new Date(now.getTime() + 60 * 60 * 1000) };
  }
  
  // Incrementar contador
  await supabase.rpc('increment_rate_limit', { eapb_id: eapbId });
  return { success: true };
}
```

---

#### 3. RLS Policies
```sql
-- Admin CAC: acceso total
CREATE POLICY admin_cac_full_access ON reportes_cancer
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin_cac'
    )
  );

-- Admin EAPB: solo sus reportes
CREATE POLICY admin_eapb_own_access ON reportes_cancer
  USING (eapb_id = auth.uid())
  WITH CHECK (eapb_id = auth.uid());

-- Operador EAPB: read + insert, no delete
CREATE POLICY operador_eapb_limited ON reportes_cancer
  FOR SELECT
  USING (eapb_id = auth.uid());

CREATE POLICY operador_eapb_insert ON reportes_cancer
  FOR INSERT
  WITH CHECK (eapb_id = auth.uid());

-- Auditor: solo lectura
CREATE POLICY auditor_readonly ON reportes_cancer
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'auditor'
    )
  );
```

---

#### 4. Audit Log
```sql
-- Tabla
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  accion VARCHAR(50), -- INSERT/UPDATE/DELETE
  tabla_objetivo VARCHAR(50),
  registro_id UUID,
  cambios JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger
CREATE FUNCTION audit_registros_cancer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (usuario_id, accion, tabla_objetivo, registro_id, cambios)
  VALUES (
    auth.uid(),
    TG_OP,
    'registros_cancer',
    NEW.id,
    jsonb_build_object('before', OLD, 'after', NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registros_cancer_audit
  AFTER INSERT OR UPDATE OR DELETE ON registros_cancer
  FOR EACH ROW EXECUTE FUNCTION audit_registros_cancer();
```

---

### SPRINT 3: Edge Functions y Integración (Día 3-4)

#### 1. Edge Function: validate-cac
```typescript
// supabase/functions/validate-cac/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { reporteId, jobId } = await req.json()
  
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    // 1. Leer archivo del reporte
    const { data: reporte } = await supabase
      .from('reportes_cancer')
      .select('*')
      .eq('id', reporteId)
      .single()

    // 2. Leer registros
    const { data: registros } = await supabase
      .from('registros_cancer')
      .select('*')
      .eq('reporte_id', reporteId)

    // 3. Validar cada registro (ejecutar motor)
    const errores = []
    for (const registro of registros) {
      const validationResult = await validateRecord(registro)
      
      if (!validationResult.esValido) {
        errores.push(...validationResult.errores)
      }
      
      // Actualizar progreso
      await supabase
        .from('validation_jobs')
        .update({ 
          processed: processed + 1,
          current_state: 'validando'
        })
        .eq('id', jobId)
    }

    // 4. Insertar errores con upsert
    await supabase
      .from('errores_validacion')
      .upsert(errores)

    // 5. Actualizar estado del reporte
    await supabase
      .from('reportes_cancer')
      .update({
        estado: 'validado',
        validated_at: new Date(),
        registros_con_error: errores.length,
        registros_validos: registros.length - errores.length
      })
      .eq('id', reporteId)

    // 6. Marcar job como completado
    await supabase
      .from('validation_jobs')
      .update({ 
        status: 'completado',
        completed_at: new Date()
      })
      .eq('id', jobId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
```

---

#### 2. Integración Dashboard → API
```typescript
// En validate/page.tsx: usar /api/validate

const handleValidate = async (reporteId: string) => {
  try {
    // 1. Triggerear validación
    const validateRes = await fetch('/api/validate', {
      method: 'POST',
      body: JSON.stringify({ reporteId })
    })
    
    const { jobId } = await validateRes.json()
    
    // 2. Conectar SSE para polling
    const eventSource = new EventSource(`/api/validate/${jobId}/status`)
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setProgress(data.percentage)
      setStats(data)
      
      if (data.status === 'completado') {
        eventSource.close()
        setIsComplete(true)
      }
    }
    
    eventSource.onerror = () => {
      eventSource.close()
      setError('Error en validación')
    }
    
  } catch (err) {
    setError('Error: ' + err.message)
  }
}
```

---

### SPRINT 4: Variables de Entorno (Día 4)

#### 1. .env.local.example
```env
# ========================================
# SUPABASE - Base de Datos en la Nube
# ========================================
# URL de tu proyecto Supabase
# Obtén en: https://supabase.com/dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co

# Clave pública de Supabase (safe to expose)
# Obtén en: https://supabase.com/dashboard → Settings → API → anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⚠️ SECRETO - Clave de servidor Supabase (NUNCA compartas)
# Obtén en: https://supabase.com/dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========================================
# NEXT-AUTH - Autenticación
# ========================================
# Generar: openssl rand -base64 32
NEXTAUTH_SECRET=tu-secreto-muy-largo-y-aleatorio-aqui

# URL de tu aplicación (cambiar en producción)
NEXTAUTH_URL=http://localhost:3000

# ========================================
# DEPLOYMENTS
# ========================================
# Entorno: development | production
NODE_ENV=development

# Vercel Analytics (opcional)
VERCEL_ANALYTICS_ID=
```

---

## 🎯 KPIs de Éxito Fase 3

| Métrica | Target | Status |
|---------|--------|--------|
| Todos endpoints funcionando | 100% | 🟡 0% |
| Latencia promedio API | < 500ms | ⏳ TBD |
| Rate limiting funcionando | Sí | ⏳ TBD |
| RLS policies aplicadas | 100% | ✅ 90% |
| Disponibilidad API | 99.5% | 🟡 TBD |
| Integración con dashboard | 100% | ❌ 0% |
| Audit log tracking | 100% de cambios | ❌ 0% |

---

## 📅 Timeline Estimado

```
Día 1:
  09:00 - Implementar POST /api/validate
  11:00 - Implementar GET /api/validate/[jobId]/status
  14:00 - Tests de ambos endpoints
  18:00 - Integración con dashboard

Día 2:
  09:00 - Implementar POST /api/export/txt y report
  11:00 - Implementar GET /api/catalogos/[tipo]
  14:00 - Cache y performance
  18:00 - Tests e2e

Día 3:
  09:00 - Middleware JWT + Rate limiting
  11:00 - RLS Policies avanzadas
  14:00 - Audit log con triggers
  18:00 - Tests de seguridad

Día 4:
  09:00 - Edge Function: validate-cac
  11:00 - SSE streaming implementation
  14:00 - Tests de validación asincrónica
  18:00 - Integration tests

Día 5 (Buffer):
  - Fixes y optimizaciones
  - Testing exhaustivo
  - Documentación
```

---

## 🔗 Tareas Iniciales Inmediatas

### ✅ Hoy (16 de abril):

**Sprint 1 - API Routes:**
```
[ ] 1. Crear POST /api/validate con validación básica
[ ] 2. Crear tabla validation_jobs en Supabase
[ ] 3. Crear GET /api/validate/[jobId]/status con SSE
[ ] 4. Crear POST /api/export/txt con ANSI encoding
[ ] 5. Crear POST /api/export/report (PDF + Excel)
[ ] 6. Crear GET /api/catalogos/[tipo] con caché
```

**Sprint 2 - Seguridad:**
```
[ ] 7. Implementar middleware.ts para JWT
[ ] 8. Mejorar rate limiting
[ ] 9. Aplicar RLS policies completas
[ ] 10. Crear audit_log con triggers
```

**Sprint 3 - Edge Functions:**
```
[ ] 11. Implementar Edge Function validate-cac
[ ] 12. Integrar SSE en dashboard
```

---

## 📊 Métricas a Monitorear

- **Latencia API**: < 500ms en 95% de requests
- **Error rate**: < 0.5% en producción
- **Rate limiting**: Máx 10 uploads/hora/EAPB
- **Audit trail**: 100% de cambios registrados
- **Uptime**: 99.5% de disponibilidad

---

## 🚀 Próximo: FASE 4
**Exportación y Reportes**: Generación de archivos finales para SISCAC, reportes PDF ejecutivos, Excel con múltiples hojas.
