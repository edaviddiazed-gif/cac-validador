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
};

function Mensajes({ errores }: { errores?: ErrorDetalle[] }) {
  if (!errores?.length) return null;
  return (
    <>
      {errores.map((e) => (
        <div key={e.id_regla} style={e.nivel === 'ERROR' ? S.errorMsg : S.warnMsg}>
          {e.nivel === 'ERROR' ? '✖' : '⚠'} {e.mensaje}
          <span style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '4px' }}>
            [{e.id_regla}]
          </span>
        </div>
      ))}
    </>
  );
}

export function Campo({ label, variableRes, required, errores, tipo = 'text', value, onChange, placeholder }: InputProps & { tipo?: string }) {
  const hasErr = errores?.some((e) => e.nivel === 'ERROR') ?? false;
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
      <Mensajes errores={errores} />
    </div>
  );
}

export function Selector({ label, variableRes, required, errores, value, onChange, opciones }: SelectProps) {
  const hasErr = errores?.some((e) => e.nivel === 'ERROR') ?? false;
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
      <Mensajes errores={errores} />
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
