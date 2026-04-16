// src/App.tsx
import { useState, useCallback } from 'react';
import axios from 'axios';
import type { CACReport, ValidationResponse } from './types';
import { initialReport } from './initialState';
import { SecIdentificacion } from './pages/SecIdentificacion';
import { SecDiagnostico } from './pages/SecDiagnostico';
import { SecTerapia, SecCirugia, SecRadioterapia } from './pages/SecTratamientos';
import { SecTrasplante, SecPaliativos, SecResultado } from './pages/SecFinal';

const SECCIONES = [
  { id: 'identificacion', label: '1. Identificación', icon: '👤' },
  { id: 'diagnostico',    label: '2. Diagnóstico',    icon: '🔬' },
  { id: 'terapia',        label: '3. Terapia Sistémica', icon: '💊' },
  { id: 'cirugia',        label: '4. Cirugía',         icon: '🔧' },
  { id: 'radioterapia',   label: '5. Radioterapia',    icon: '☢️' },
  { id: 'trasplante',     label: '6. Trasplante / Cx Rec.', icon: '🫀' },
  { id: 'paliativos',     label: '7. Paliativos / Soporte', icon: '🤝' },
  { id: 'resultado',      label: '8. Resultado y Novedades', icon: '📋' },
];

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Actualiza un campo en profundidad usando dot-notation
function setNested(obj: any, path: string, value: any): any {
  const clone = structuredClone(obj);
  const parts = path.split('.');
  let cur = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] === undefined || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return clone;
}

export default function App() {
  const [report, setReport] = useState<CACReport>(initialReport);
  const [seccion, setSeccion] = useState(0);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reglas levantadas: set de id_regla que el usuario justificó clínicamente
  const [levantadas, setLevantadas] = useState<Set<string>>(new Set());

  const toggleLevantada = useCallback((idRegla: string) => {
    setLevantadas(prev => {
      const next = new Set(prev);
      if (next.has(idRegla)) {
        next.delete(idRegla);
      } else {
        next.add(idRegla);
      }
      return next;
    });
  }, []);

  const set = useCallback((path: string, val: any) => {
    setReport(prev => {
      let updated = setNested(prev, path, val);
      // Sync resultado.fecha_bdua when cabecera.fecha_corte changes
      // V134 is read from resultado.fecha_bdua by the validation engine
      if (path === 'cabecera.fecha_corte') {
        updated = setNested(updated, 'resultado.fecha_bdua', val);
      }
      return updated;
    });
  }, []);

  const validar = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...report, reglas_levantadas: Array.from(levantadas) };
      const { data } = await axios.post<ValidationResponse>(`${API}/api/validar-cac`, payload);
      setValidation(data);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(' | ')
        : (typeof detail === 'string' ? detail : 'Error al conectar con el backend. ¿Está corriendo en http://localhost:8000?');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const seccionesConErrores = validation
    ? Object.keys(validation.resumen_por_seccion).filter(s => validation.resumen_por_seccion[s].criticos > 0)
    : [];

  const SECCION_MAP: Record<string, string> = {
    identificacion: 'identificacion',
    diagnostico: 'diagnostico',
    terapia: 'terapia_sistemica',
    cirugia: 'cirugia',
    radioterapia: 'radioterapia',
    trasplante: 'trasplante',
    paliativos: 'cuidados_paliativos',
    resultado: 'resultado',
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#F3F4F6', minHeight: '100vh' }}>
      {/* ── Header ── */}
      <header style={{ background: '#1E3A5F', color: '#fff', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>🏥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '.02em' }}>Validador CAC</div>
            <div style={{ fontSize: '11px', color: '#93C5FD' }}>Resolución 0247 de 2023 — Colombia</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {validation && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span style={{ background: validation.total_errores === 0 ? '#065F46' : '#7F1D1D', borderRadius: '20px', padding: '3px 12px', color: '#fff', fontWeight: 600 }}>
                {validation.total_errores === 0 ? '✔ Válido' : `✖ ${validation.total_errores} error${validation.total_errores !== 1 ? 'es' : ''}`}
              </span>
              {validation.total_advertencias > 0 && (
                <span style={{ background: '#78350F', borderRadius: '20px', padding: '3px 12px', color: '#FDE68A', fontWeight: 600 }}>
                  ⚠ {validation.total_advertencias} advertencia{validation.total_advertencias !== 1 ? 's' : ''}
                </span>
              )}
              {levantadas.size > 0 && (
                <span style={{ background: '#5B21B6', borderRadius: '20px', padding: '3px 12px', color: '#EDE9FE', fontWeight: 600 }}>
                  ☑ {levantadas.size} levantada{levantadas.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          <button onClick={validar} disabled={loading}
            style={{ background: loading ? '#374151' : '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
            {loading ? '⏳ Validando...' : '▶ Validar Reporte'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        {/* ── Sidebar ── */}
        <aside style={{ width: '220px', minWidth: '220px', background: '#fff', borderRight: '1px solid #E5E7EB', padding: '16px 0', overflowY: 'auto' }}>
          {SECCIONES.map((s, i) => {
            const backendKey = SECCION_MAP[s.id] ?? s.id;
            const resumen = validation?.resumen_por_seccion?.[backendKey];
            const tieneError = resumen && resumen.criticos > 0;
            const tieneWarn = resumen && resumen.advertencias > 0 && !tieneError;
            const activa = i === seccion;
            return (
              <button key={s.id} onClick={() => setSeccion(i)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', cursor: 'pointer',
                  background: activa ? '#EFF6FF' : 'transparent',
                  borderLeft: `3px solid ${activa ? '#2563EB' : tieneError ? '#EF4444' : tieneWarn ? '#F59E0B' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px',
                  color: activa ? '#1D4ED8' : tieneError ? '#B91C1C' : '#374151', transition: 'all .1s',
                }}>
                <span>{s.icon}</span>
                <span style={{ flex: 1 }}>{s.label}</span>
                {tieneError && <span style={{ background: '#EF4444', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '10px' }}>{resumen!.criticos}</span>}
                {tieneWarn && <span style={{ background: '#F59E0B', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '10px' }}>!</span>}
              </button>
            );
          })}

          {/* JSON export */}
          <div style={{ padding: '16px', borderTop: '1px solid #F3F4F6', marginTop: '8px' }}>
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = `cac-${report.cabecera.id_reporte || 'reporte'}.json`; a.click();
            }} style={{ width: '100%', padding: '7px', fontSize: '11px', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', color: '#374151' }}>
              ⬇ Exportar JSON
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ maxWidth: '880px' }}>
            {/* Título sección */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E3A5F', margin: 0 }}>
                {SECCIONES[seccion].icon} {SECCIONES[seccion].label}
              </h2>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                Reporte: <strong>{report.cabecera.id_reporte || '(sin ID)'}</strong> · Corte: <strong>{report.cabecera.fecha_corte || '(sin fecha)'}</strong>
              </div>
            </div>

            {/* Error de conexión */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#991B1B' }}>
                ✖ {error}
              </div>
            )}

            {/* Resumen de errores de esta sección */}
            {validation && (() => {
              const backendKey = SECCION_MAP[SECCIONES[seccion].id] ?? SECCIONES[seccion].id;
              const camposSeccion = Object.keys(validation.errores_por_campo)
                .filter(c => c.startsWith(backendKey));
              if (!camposSeccion.length) return null;
              return (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B', marginBottom: '6px' }}>
                    Errores en esta sección:
                  </div>
                  {camposSeccion.map(campo =>
                    validation.errores_por_campo[campo].map(e => (
                      <div key={e.id_regla} style={{ fontSize: '12px', color: e.nivel === 'ERROR' ? '#B91C1C' : '#92400E', marginBottom: '2px' }}>
                        {e.nivel === 'ERROR' ? '✖' : '⚠'} [{e.id_regla}] {e.mensaje}
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {/* Formulario sección activa */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
              {seccion === 0 && <SecIdentificacion data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
              {seccion === 1 && <SecDiagnostico data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
              {seccion === 2 && <SecTerapia data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
              {seccion === 3 && <SecCirugia data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
              {seccion === 4 && <SecRadioterapia data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
              {seccion === 5 && <SecTrasplante data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
              {seccion === 6 && <SecPaliativos data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
              {seccion === 7 && <SecResultado data={report} set={set} val={validation} levantadas={levantadas} onLevantarRegla={toggleLevantada} />}
            </div>

            {/* Navegación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={() => setSeccion(s => Math.max(0, s - 1))} disabled={seccion === 0}
                style={{ padding: '9px 20px', fontSize: '13px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: seccion === 0 ? 'not-allowed' : 'pointer', color: '#374151' }}>
                ← Anterior
              </button>
              <button onClick={validar} disabled={loading}
                style={{ padding: '9px 20px', fontSize: '13px', background: '#2563EB', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 600 }}>
                {loading ? '⏳' : '▶'} Validar
              </button>
              <button onClick={() => setSeccion(s => Math.min(SECCIONES.length - 1, s + 1))} disabled={seccion === SECCIONES.length - 1}
                style={{ padding: '9px 20px', fontSize: '13px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: seccion === SECCIONES.length - 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>
                Siguiente →
              </button>
            </div>
          </div>
        </main>

        {/* ── Panel de errores ── */}
        {validation && (
          <aside style={{ width: '280px', minWidth: '280px', background: '#fff', borderLeft: '1px solid #E5E7EB', padding: '16px', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E3A5F', marginBottom: '12px' }}>
              📊 Resumen de Validación
            </div>

            {/* Semáforo */}
            <div style={{ textAlign: 'center', padding: '16px', background: validation.valido ? '#ECFDF5' : '#FEF2F2', borderRadius: '10px', marginBottom: '16px', border: `1px solid ${validation.valido ? '#A7F3D0' : '#FECACA'}` }}>
              <div style={{ fontSize: '32px' }}>{validation.valido ? '✅' : '❌'}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: validation.valido ? '#065F46' : '#991B1B', marginTop: '4px' }}>
                {validation.valido ? 'REPORTE VÁLIDO' : 'REPORTE CON ERRORES'}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                {validation.total_errores} error(es) crítico(s) · {validation.total_advertencias} advertencia(s)
                {levantadas.size > 0 && <span style={{ color: '#7C3AED' }}> · {levantadas.size} levantada(s)</span>}
              </div>
            </div>

            {/* Por sección */}
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Por sección:</div>
            {Object.entries(validation.resumen_por_seccion).map(([sec, res]) => (
              <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '12px' }}>
                <span style={{ flex: 1, color: '#374151' }}>{sec}</span>
                {res.criticos > 0 && <span style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '10px', padding: '1px 8px', fontWeight: 600 }}>{res.criticos} ✖</span>}
                {res.advertencias > 0 && <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '10px', padding: '1px 8px' }}>{res.advertencias} ⚠</span>}
                {res.criticos === 0 && res.advertencias === 0 && <span style={{ color: '#10B981' }}>✔</span>}
              </div>
            ))}

            {/* Errores generales */}
            {validation.errores_generales.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B', marginBottom: '6px' }}>Errores generales:</div>
                {validation.errores_generales.map((e: any) => (
                  <div key={e.id_regla} style={{ fontSize: '11.5px', color: '#B91C1C', marginBottom: '4px', lineHeight: 1.4 }}>
                    ✖ {e.mensaje}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
