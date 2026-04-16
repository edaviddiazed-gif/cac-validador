// src/components/Field.tsx
import React from 'react';
import type { ErrorDetalle } from '../types';
import type { OpcionCat } from '../catalogos';

interface BaseProps {
  label: string;
  campo: string;
  required?: boolean;
  variableRes?: string;
  errores?: ErrorDetalle[];
  levantadas?: Set<string>;
  onLevantarRegla?: (id: string) => void;
}

interface InputProps extends BaseProps {
  type?: 'text' | 'date';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

interface SelectProps extends BaseProps {
  value: string;
  onChange: (val: string) => void;
  opciones: OpcionCat[];
}

const S = {
  group: { marginBottom: '14px' } as React.CSSProperties,
  label: {
    display: 'flex', gap: '6px', alignItems: 'baseline',
    fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px',
  } as React.CSSProperties,
  varTag: {
    fontSize: '10px', background: '#E5E7EB', color: '#6B7280',
    borderRadius: '4px', padding: '1px 5px', fontFamily: 'monospace',
  } as React.CSSProperties,
  req: { color: '#EF4444', marginLeft: '2px' } as React.CSSProperties,
  input: (hasErr: boolean): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '8px 10px', fontSize: '13px',
    border: `1px solid ${hasErr ? '#EF4444' : '#D1D5DB'}`,
    borderRadius: '6px', background: hasErr ? '#FEF2F2' : '#fff',
    outline: 'none', transition: 'border-color .15s',
  }),
  errorMsg: {
    fontSize: '11.5px', color: '#EF4444', marginTop: '3px',
    display: 'flex', alignItems: 'center', gap: '4px',
  } as React.CSSProperties,
  warnMsg: {
    fontSize: '11.5px', color: '#D97706', marginTop: '3px',
    display: 'flex', alignItems: 'center', gap: '4px',
  } as React.CSSProperties,
  levantadaMsg: {
    fontSize: '11.5px', color: '#7C3AED', marginTop: '3px',
    display: 'flex', alignItems: 'center', gap: '4px',
    background: '#F5F3FF', borderRadius: '4px', padding: '2px 6px',
  } as React.CSSProperties,
};

interface MensajesProps {
  errores?: ErrorDetalle[];
  levantadas?: Set<string>;
  onLevantarRegla?: (id: string) => void;
}

function Mensajes({ errores, levantadas, onLevantarRegla }: MensajesProps) {
  if (!errores?.length) return null;
  return (
    <>
      {errores.map((e) => {
        const esLevantada = e.nivel === 'LEVANTADA' || levantadas?.has(e.id_regla);
        const esError = e.nivel === 'ERROR' && !esLevantada;
        const esAdv = e.nivel === 'ADVERTENCIA' && !esLevantada;
        return (
          <div key={e.id_regla} style={{ marginTop: '3px' }}>
            <div style={{
              ...(esLevantada ? S.levantadaMsg : esError ? S.errorMsg : S.warnMsg),
              alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0 }}>
                {esLevantada ? '☑' : esError ? '✖' : '⚠'}
              </span>
              <span style={{ flex: 1 }}>
                {esLevantada
                  ? <s style={{ opacity: 0.6 }}>{e.mensaje.replace('[Regla levantada] ', '')}</s>
                  : e.mensaje}
                <span style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '4px' }}>
                  [{e.id_regla}]
                </span>
              </span>
              {/* Check para levantar la regla — solo para errores y advertencias */}
              {!esLevantada && onLevantarRegla && (
                <label title="Levantar regla: marcar excepción clínica justificada"
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px',
                           fontSize: '10px', color: '#6B7280', cursor: 'pointer', marginLeft: '6px',
                           userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => onLevantarRegla(e.id_regla)}
                    style={{ cursor: 'pointer', accentColor: '#7C3AED' }}
                  />
                  levantar
                </label>
              )}
              {/* Deshacer levantamiento */}
              {esLevantada && onLevantarRegla && (
                <label title="Deshacer levantamiento"
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px',
                           fontSize: '10px', color: '#7C3AED', cursor: 'pointer', marginLeft: '6px' }}>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => onLevantarRegla(e.id_regla)}
                    style={{ cursor: 'pointer', accentColor: '#7C3AED' }}
                  />
                  levantada
                </label>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}


const FECHAS_CENTINELA = ['1800-01-01', '1845-01-01', '1846-01-01', '1840-01-01'];

export function CampoFecha({ label, variableRes, required, errores, value, onChange, campo }: InputProps & { tipo?: string }) {
  const hasErr = errores?.some((e) => e.nivel === 'ERROR') ?? false;
  const esCentinela = FECHAS_CENTINELA.includes(value);
  
  // For the date picker, use empty string if centinela (so picker shows blank)
  const dateValue = esCentinela ? '' : value;
  
  return (
    <div style={S.group}>
      <label style={S.label}>
        {label}
        {variableRes && <span style={S.varTag}>{variableRes}</span>}
        {required && <span style={S.req}>*</span>}
      </label>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => {
          const v = e.target.value;
          // If cleared, set to 1845-01-01 (No Aplica)
          onChange(v || '1845-01-01');
        }}
        style={S.input(hasErr)}
      />
      {esCentinela && (
        <div style={{ fontSize:'11px', color:'#6B7280', marginTop:'2px' }}>
          {value === '1845-01-01' ? 'No Aplica' : value === '1800-01-01' ? 'Desconocida' : value}
        </div>
      )}
      <Mensajes errores={errores} />
    </div>
  );
}

export function Campo({ label, variableRes, required, errores, tipo = 'text', value, onChange, placeholder, levantadas, onLevantarRegla }: InputProps & { tipo?: string }) {
  const hasErr = errores?.some((e) => e.nivel === 'ERROR' && !levantadas?.has(e.id_regla)) ?? false;
  return (
    <div style={S.group}>
      <label style={S.label}>
        {label}
        {variableRes && <span style={S.varTag}>{variableRes}</span>}
        {required && <span style={S.req}>*</span>}
      </label>
      <input
        type={tipo}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={S.input(hasErr)}
      />
      <Mensajes errores={errores} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
    </div>
  );
}

export function Selector({ label, variableRes, required, errores, value, onChange, opciones, levantadas, onLevantarRegla }: SelectProps) {
  const hasErr = errores?.some((e) => e.nivel === 'ERROR' && !levantadas?.has(e.id_regla)) ?? false;
  return (
    <div style={S.group}>
      <label style={S.label}>
        {label}
        {variableRes && <span style={S.varTag}>{variableRes}</span>}
        {required && <span style={S.req}>*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={S.input(hasErr)}>
        <option value="">— Seleccione —</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Mensajes errores={errores} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
    </div>
  );
}

export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 20px' }}>
      {children}
    </div>
  );
}

export function Alerta({ texto, tipo }: { texto: string; tipo: 'info' | 'warn' }) {
  const bg = tipo === 'warn' ? '#FEF3C7' : '#EFF6FF';
  const border = tipo === 'warn' ? '#F59E0B' : '#3B82F6';
  const icon = tipo === 'warn' ? '⚠️' : 'ℹ️';
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: '8px',
      padding: '10px 14px', fontSize: '12.5px', margin: '8px 0',
      display: 'flex', gap: '8px', alignItems: 'flex-start',
    }}>
      <span>{icon}</span>
      <span>{texto}</span>
    </div>
  );
}
