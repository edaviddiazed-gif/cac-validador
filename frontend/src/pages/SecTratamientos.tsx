// src/pages/SecTratamientos.tsx
import { Campo, Selector, Grid, Alerta } from '../components/Field';
import { CAT } from '../catalogos';
import type { CACReport, ValidationResponse, EsquemaQt } from '../types';

interface Props { data: CACReport; set: (path: string, val: any) => void; val: ValidationResponse | null; }
function errs(val: ValidationResponse | null, campo: string) { return val?.errores_por_campo?.[campo] ?? []; }

const esquemaVacio: EsquemaQt = {
  ubicacion_temporal: '', fecha_inicio: '', fecha_fin: '1800-01-01',
  num_ips: '1', ips1: '', ips2: '98', num_medicamentos: '',
  medicamentos: [''], qt_intratecal: '2', caracteristicas: '3', motivo_finalizacion: '98',
};

function EsquemaForm({ prefix, label, esquema, set, val, mostrarMotivo }: {
  prefix: string; label: string; esquema: EsquemaQt;
  set: (path: string, val: any) => void; val: ValidationResponse | null; mostrarMotivo: boolean;
}) {
  return (
    <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px', marginTop:'10px' }}>
      <div style={{ fontWeight:600, fontSize:'12px', color:'#374151', marginBottom:'10px' }}>{label}</div>
      <Grid cols={3}>
        <Selector label="Ubicación temporal" campo={`${prefix}.ubicacion_temporal`}
          variableRes={prefix.includes('primer') ? 'V48' : 'V61'} value={esquema.ubicacion_temporal}
          onChange={(v) => set(`${prefix}.ubicacion_temporal`, v)}
          opciones={CAT.ubicacion_esquema} errores={errs(val, `${prefix}.ubicacion_temporal`)} />
        <Campo label="Fecha inicio esquema" campo={`${prefix}.fecha_inicio`}
          variableRes={prefix.includes('primer') ? 'V49' : 'V62'} tipo="date"
          value={esquema.fecha_inicio} onChange={(v) => set(`${prefix}.fecha_inicio`, v)}
          errores={errs(val, `${prefix}.fecha_inicio`)} />
        <Campo label="Fecha fin esquema (1800-01-01 si en curso)" campo={`${prefix}.fecha_fin`}
          variableRes={prefix.includes('primer') ? 'V58' : 'V68'}
          value={esquema.fecha_fin} onChange={(v) => set(`${prefix}.fecha_fin`, v)}
          errores={errs(val, `${prefix}.fecha_fin`)} />
      </Grid>
      <Grid cols={3}>
        <Campo label="Código IPS 1 (REPS)" campo={`${prefix}.ips1`}
          variableRes={prefix.includes('primer') ? 'V51' : 'V63'}
          value={esquema.ips1} onChange={(v) => set(`${prefix}.ips1`, v)}
          errores={errs(val, `${prefix}.ips1`)} />
        <Campo label="Código IPS 2 (98 si solo 1)" campo={`${prefix}.ips2`}
          variableRes={prefix.includes('primer') ? 'V52' : 'V64'}
          value={esquema.ips2} onChange={(v) => set(`${prefix}.ips2`, v)} />
        <Campo label="Nº medicamentos antineoplásicos" campo={`${prefix}.num_medicamentos`}
          variableRes={prefix.includes('primer') ? 'V53' : 'V65'}
          value={esquema.num_medicamentos} onChange={(v) => set(`${prefix}.num_medicamentos`, v)} placeholder="1-9" />
      </Grid>
      <div style={{ marginBottom:'10px' }}>
        <div style={{ fontSize:'12px', fontWeight:600, color:'#374151', marginBottom:'4px' }}>
          Medicamentos ATC {prefix.includes('primer') ? '(V53.1–V56)' : '(V66.1–V69)'}
        </div>
        {esquema.medicamentos.map((med, i) => (
          <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'4px' }}>
            <input value={med} onChange={(e) => {
              const arr = [...esquema.medicamentos];
              arr[i] = e.target.value;
              set(`${prefix}.medicamentos`, arr);
            }} placeholder={`ATC medicamento ${i+1} (ej. L01DB03)`}
            style={{ flex:1, padding:'7px 10px', fontSize:'12px', border:'1px solid #D1D5DB', borderRadius:'6px' }} />
            {i === esquema.medicamentos.length - 1 && i < 8 && (
              <button type="button" onClick={() => set(`${prefix}.medicamentos`, [...esquema.medicamentos, ''])}
                style={{ padding:'4px 10px', fontSize:'12px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'6px', cursor:'pointer' }}>
                +
              </button>
            )}
          </div>
        ))}
      </div>
      <Grid cols={3}>
        <Selector label="¿QT intratecal?" campo={`${prefix}.qt_intratecal`}
          variableRes={prefix.includes('primer') ? 'V57' : 'V67'}
          value={esquema.qt_intratecal} onChange={(v) => set(`${prefix}.qt_intratecal`, v)}
          opciones={[{value:'1',label:'1 – Sí'},{value:'2',label:'2 – No'},{value:'98',label:'98 – No aplica'}]} />
        <Selector label="Características del esquema" campo={`${prefix}.caracteristicas`}
          variableRes={prefix.includes('primer') ? 'V59' : 'V70'}
          value={esquema.caracteristicas} onChange={(v) => set(`${prefix}.caracteristicas`, v)}
          opciones={CAT.caracteristicas_esq} />
        {mostrarMotivo && esquema.caracteristicas === '2' && (
          <Selector label="Motivo finalización prematura" campo={`${prefix}.motivo_finalizacion`}
            variableRes={prefix.includes('primer') ? 'V60' : 'V71'}
            value={esquema.motivo_finalizacion} onChange={(v) => set(`${prefix}.motivo_finalizacion`, v)}
            opciones={CAT.motivo_fin_esq} />
        )}
      </Grid>
    </div>
  );
}

export function SecTerapia({ data, set, val }: Props) {
  const t = data.terapia_sistemica;
  const recibeQt = t.recibio_qt === '1';
  const tieneUltimo = !!t.ultimo_esquema;

  return (
    <div>
      <Selector label="¿Recibió quimioterapia u otra terapia sistémica en este período?" campo="terapia_sistemica.recibio_qt"
        variableRes="V45" required value={t.recibio_qt}
        onChange={(v) => {
          set('terapia_sistemica.recibio_qt', v);
          if (v === '1' && !t.primer_esquema) set('terapia_sistemica.primer_esquema', esquemaVacio);
          if (v !== '1') { set('terapia_sistemica.primer_esquema', null); set('terapia_sistemica.ultimo_esquema', null); }
        }}
        opciones={CAT.recibio_qt} errores={errs(val,'terapia_sistemica.recibio_qt')} />

      {recibeQt && (
        <>
          <Grid cols={2}>
            <Campo label="Número de ciclos en el período" campo="terapia_sistemica.num_ciclos"
              variableRes="V47" value={t.num_ciclos}
              onChange={(v) => set('terapia_sistemica.num_ciclos', v)} placeholder="55=ente territorial, 98=no aplica" />
          </Grid>

          {t.primer_esquema && (
            <EsquemaForm prefix="terapia_sistemica.primer_esquema" label="PRIMER o ÚNICO Esquema"
              esquema={t.primer_esquema} set={set} val={val} mostrarMotivo />
          )}

          <div style={{ marginTop:'12px' }}>
            {!tieneUltimo ? (
              <button type="button"
                onClick={() => set('terapia_sistemica.ultimo_esquema', { ...esquemaVacio, ubicacion_temporal: '97' })}
                style={{ fontSize:'12px', padding:'7px 14px', background:'#F3F4F6', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer' }}>
                + Agregar último esquema (si recibió más de uno)
              </button>
            ) : (
              <>
                <EsquemaForm prefix="terapia_sistemica.ultimo_esquema" label="ÚLTIMO Esquema (si diferente al primero)"
                  esquema={t.ultimo_esquema!} set={set} val={val} mostrarMotivo />
                <button type="button" onClick={() => set('terapia_sistemica.ultimo_esquema', null)}
                  style={{ fontSize:'11px', marginTop:'6px', padding:'4px 10px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', cursor:'pointer', color:'#991B1B' }}>
                  Eliminar último esquema
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SecCirugia({ data, set, val }: Props) {
  const c = data.cirugia;
  const recibioCx = c.recibio_cirugia === '1';
  const masDeUna = parseInt(c.num_cirugias || '0') > 1;

  return (
    <div>
      <Selector label="¿Fue sometido a cirugías oncológicas en este período?" campo="cirugia.recibio_cirugia"
        variableRes="V74" required value={c.recibio_cirugia}
        onChange={(v) => set('cirugia.recibio_cirugia', v)} opciones={CAT.recibio_cirugia}
        errores={errs(val,'cirugia.recibio_cirugia')} />

      {recibioCx && (
        <>
          <Campo label="Número total de cirugías en el período" campo="cirugia.num_cirugias"
            variableRes="V75" value={c.num_cirugias} onChange={(v) => set('cirugia.num_cirugias', v)} placeholder="1, 2, 3..." />

          <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px', margin:'10px 0' }}>
            <div style={{ fontWeight:600, fontSize:'12px', marginBottom:'10px' }}>Primera Cirugía (V76–V81)</div>
            <Grid cols={3}>
              <Campo label="Fecha primera cirugía" campo="cirugia.fecha_primera"
                variableRes="V76" tipo="date" value={c.fecha_primera}
                onChange={(v) => set('cirugia.fecha_primera', v)} errores={errs(val,'cirugia.fecha_primera')} />
              <Campo label="Código IPS primera cirugía" campo="cirugia.ips_primera"
                variableRes="V77" value={c.ips_primera} onChange={(v) => set('cirugia.ips_primera', v)} />
              <Campo label="Código CUPS primera cirugía" campo="cirugia.cups_primera"
                variableRes="V78" value={c.cups_primera} onChange={(v) => set('cirugia.cups_primera', v)}
                errores={errs(val,'cirugia.cups_primera')} />
            </Grid>
            <Grid cols={2}>
              <Selector label="Ubicación temporal" campo="cirugia.ubicacion_primera" variableRes="V79"
                value={c.ubicacion_primera} onChange={(v) => set('cirugia.ubicacion_primera', v)}
                opciones={[
                  {value:'1',label:'1 – Tratamiento inicial curativo'},
                  {value:'5',label:'5 – Manejo de recaída'},
                  {value:'6',label:'6 – Manejo de enf. metastásica'},
                  {value:'55',label:'55 – Ente territorial'},
                  {value:'98',label:'98 – No aplica'},
                ]} />
            </Grid>
          </div>

          {masDeUna && (
            <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px', margin:'10px 0' }}>
              <div style={{ fontWeight:600, fontSize:'12px', marginBottom:'10px' }}>Última Cirugía (V82–V86)</div>
              <Grid cols={3}>
                <Campo label="Fecha última cirugía" campo="cirugia.fecha_ultima" variableRes="V82"
                  tipo="date" value={c.fecha_ultima} onChange={(v) => set('cirugia.fecha_ultima', v)}
                  errores={errs(val,'cirugia.fecha_ultima')} />
                <Campo label="Código IPS última cirugía" campo="cirugia.ips_ultima" variableRes="V83"
                  value={c.ips_ultima} onChange={(v) => set('cirugia.ips_ultima', v)} />
                <Campo label="Código CUPS última cirugía" campo="cirugia.cups_ultima" variableRes="V84"
                  value={c.cups_ultima} onChange={(v) => set('cirugia.cups_ultima', v)} />
              </Grid>
              <Grid cols={2}>
                <Selector label="Estado vital post-cirugía" campo="cirugia.estado_vital_post_cirugia" variableRes="V86"
                  value={c.estado_vital_post_cirugia} onChange={(v) => set('cirugia.estado_vital_post_cirugia', v)}
                  opciones={[{value:'1',label:'1 – Vivo'},{value:'2',label:'2 – Fallece'},{value:'55',label:'55 – Ente territorial'},{value:'98',label:'98 – No aplica'}]} />
              </Grid>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function SecRadioterapia({ data, set, val }: Props) {
  const rt = data.radioterapia;
  const recibeRt = rt.recibio_rt === '1';

  return (
    <div>
      <Selector label="¿Recibió radioterapia en este período?" campo="radioterapia.recibio_rt"
        variableRes="V87" required value={rt.recibio_rt}
        onChange={(v) => {
          set('radioterapia.recibio_rt', v);
          if (v === '1' && !rt.primer_esquema) set('radioterapia.primer_esquema', { fecha_inicio:'', ubicacion_temporal:'', tipo_rt:'', ips1:'', fecha_fin:'1800-01-01', caracteristicas:'3' });
          if (v !== '1') set('radioterapia.primer_esquema', null);
        }}
        opciones={CAT.recibio_rt} errores={errs(val,'radioterapia.recibio_rt')} />

      {recibeRt && (
        <>
          <Campo label="Número total de sesiones de radioterapia" campo="radioterapia.num_sesiones"
            variableRes="V88" value={rt.num_sesiones} onChange={(v) => set('radioterapia.num_sesiones', v)} />
          {rt.primer_esquema && (
            <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px', marginTop:'10px' }}>
              <div style={{ fontWeight:600, fontSize:'12px', marginBottom:'10px' }}>Primer / Único esquema de RT (V89–V97)</div>
              <Grid cols={3}>
                <Campo label="Fecha inicio RT" campo="radioterapia.primer_esquema.fecha_inicio" variableRes="V89"
                  tipo="date" value={rt.primer_esquema.fecha_inicio}
                  onChange={(v) => set('radioterapia.primer_esquema.fecha_inicio', v)}
                  errores={errs(val,'radioterapia.primer_esquema.fecha_inicio')} />
                <Selector label="Ubicación temporal" campo="radioterapia.primer_esquema.ubicacion_temporal" variableRes="V90"
                  value={rt.primer_esquema.ubicacion_temporal}
                  onChange={(v) => set('radioterapia.primer_esquema.ubicacion_temporal', v)}
                  opciones={CAT.ubicacion_esquema} errores={errs(val,'radioterapia.primer_esquema.ubicacion_temporal')} />
                <Campo label="Código CUPS tipo RT" campo="radioterapia.primer_esquema.tipo_rt" variableRes="V91"
                  value={rt.primer_esquema.tipo_rt} onChange={(v) => set('radioterapia.primer_esquema.tipo_rt', v)} />
              </Grid>
              <Grid cols={3}>
                <Campo label="Código IPS RT" campo="radioterapia.primer_esquema.ips1" variableRes="V93"
                  value={rt.primer_esquema.ips1} onChange={(v) => set('radioterapia.primer_esquema.ips1', v)} />
                <Campo label="Fecha fin RT (1800-01-01 si en curso)" campo="radioterapia.primer_esquema.fecha_fin" variableRes="V95"
                  value={rt.primer_esquema.fecha_fin} onChange={(v) => set('radioterapia.primer_esquema.fecha_fin', v)} />
                <Selector label="Características RT" campo="radioterapia.primer_esquema.caracteristicas" variableRes="V96"
                  value={rt.primer_esquema.caracteristicas} onChange={(v) => set('radioterapia.primer_esquema.caracteristicas', v)}
                  opciones={CAT.caracteristicas_esq} />
              </Grid>
            </div>
          )}
        </>
      )}
    </div>
  );
}
