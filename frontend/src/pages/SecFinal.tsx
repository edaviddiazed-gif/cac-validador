// src/pages/SecFinal.tsx
import { Campo, Selector, Grid } from '../components/Field';
import { CAT } from '../catalogos';
import type { CACReport, ValidationResponse } from '../types';

interface Props { data: CACReport; set: (path: string, val: string) => void; val: ValidationResponse | null; }
function errs(val: ValidationResponse | null, campo: string) { return val?.errores_por_campo?.[campo] ?? []; }

export function SecTrasplante({ data, set, val }: Props) {
  const t = data.trasplante;
  const cr = data.cirugia_reconstructiva;
  const recibeTrasplante = t.recibio_trasplante === '1';
  const recibeCxRec = cr.recibio_cx_rec === '1';

  return (
    <div>
      <Selector label="¿Recibió trasplante de células progenitoras hematopoyéticas?" campo="trasplante.recibio_trasplante"
        variableRes="V106" required value={t.recibio_trasplante}
        onChange={(v) => set('trasplante.recibio_trasplante', v)} opciones={CAT.recibio_trasplante} />

      {recibeTrasplante && (
        <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px', margin:'10px 0' }}>
          <Grid cols={2}>
            <Selector label="Tipo de trasplante" campo="trasplante.tipo_trasplante" variableRes="V107"
              value={t.tipo_trasplante} onChange={(v) => set('trasplante.tipo_trasplante', v)}
              opciones={[
                {value:'1',label:'1 – Autólogo'},{value:'2',label:'2 – Alogénico donante idéntico relacionado'},
                {value:'3',label:'3 – Alogénico no idéntico relacionado'},{value:'4',label:'4 – Alogénico idéntico no relacionado'},
                {value:'55',label:'55 – Ente territorial'},{value:'98',label:'98 – No aplica'},
              ]} />
            <Campo label="Fecha de trasplante" campo="trasplante.fecha_trasplante" variableRes="V109"
              tipo="date" value={t.fecha_trasplante} onChange={(v) => set('trasplante.fecha_trasplante', v)} />
          </Grid>
          <Campo label="Código IPS que realizó el trasplante" campo="trasplante.ips_trasplante" variableRes="V110"
            value={t.ips_trasplante} onChange={(v) => set('trasplante.ips_trasplante', v)} />
        </div>
      )}

      <hr style={{ margin:'16px 0', borderColor:'#F3F4F6' }} />

      <Selector label="¿Recibió cirugía reconstructiva?" campo="cirugia_reconstructiva.recibio_cx_rec"
        variableRes="V111" required value={cr.recibio_cx_rec}
        onChange={(v) => set('cirugia_reconstructiva.recibio_cx_rec', v)}
        opciones={[{value:'1',label:'1 – Sí'},{value:'55',label:'55 – Ente territorial'},{value:'98',label:'98 – No aplica'}]} />

      {recibeCxRec && (
        <Grid cols={2}>
          <Campo label="Fecha cirugía reconstructiva" campo="cirugia_reconstructiva.fecha_cx_rec" variableRes="V112"
            tipo="date" value={cr.fecha_cx_rec} onChange={(v) => set('cirugia_reconstructiva.fecha_cx_rec', v)} />
          <Campo label="Código IPS cirugía reconstructiva" campo="cirugia_reconstructiva.ips_cx_rec" variableRes="V113"
            value={cr.ips_cx_rec} onChange={(v) => set('cirugia_reconstructiva.ips_cx_rec', v)} />
        </Grid>
      )}
    </div>
  );
}

export function SecPaliativos({ data, set, val }: Props) {
  const cp = data.cuidados_paliativos;
  const s = data.soporte;
  const valorado = cp.valorado === '1';

  return (
    <div>
      <Selector label="¿Fue valorado en cuidado paliativo en este período?" campo="cuidados_paliativos.valorado"
        variableRes="V114" required value={cp.valorado}
        onChange={(v) => set('cuidados_paliativos.valorado', v)}
        opciones={[{value:'1',label:'1 – Sí'},{value:'2',label:'2 – No'},{value:'55',label:'55 – Ente territorial'}]} />

      {valorado && (
        <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px', margin:'10px 0' }}>
          <Grid cols={2}>
            <Campo label="Fecha primera atención paliativa" campo="cuidados_paliativos.fecha_primera_atencion"
              variableRes="V115" tipo="date" value={cp.fecha_primera_atencion}
              onChange={(v) => set('cuidados_paliativos.fecha_primera_atencion', v)} />
            <Campo label="Código IPS atención paliativa" campo="cuidados_paliativos.ips_paliativo" variableRes="V116"
              value={cp.ips_paliativo} onChange={(v) => set('cuidados_paliativos.ips_paliativo', v)} />
          </Grid>
        </div>
      )}

      <hr style={{ margin:'16px 0', borderColor:'#F3F4F6' }} />

      <Grid cols={2}>
        <Selector label="¿Valorado por psiquiatría?" campo="soporte.psiquiatria" variableRes="V117"
          value={s.psiquiatria} onChange={(v) => set('soporte.psiquiatria', v)}
          opciones={[{value:'1',label:'1 – Sí, fue valorado'},{value:'2',label:'2 – No, está pendiente'},{value:'55',label:'55 – Ente territorial'},{value:'98',label:'98 – No se ha ordenado'}]} />
        <Selector label="¿Valorado por nutrición?" campo="soporte.nutricion" variableRes="V120"
          value={s.nutricion} onChange={(v) => set('soporte.nutricion', v)}
          opciones={[{value:'1',label:'1 – Sí'},{value:'2',label:'2 – Pendiente'},{value:'55',label:'55 – Ente territorial'},{value:'98',label:'98 – No ordenado'}]} />
      </Grid>

      {s.nutricion === '1' && (
        <Grid cols={2}>
          <Campo label="Fecha consulta inicial nutrición" campo="soporte.fecha_nutricion" variableRes="V121"
            tipo="date" value={s.fecha_nutricion} onChange={(v) => set('soporte.fecha_nutricion', v)} />
        </Grid>
      )}

      <Grid cols={2}>
        <Selector label="Soporte nutricional" campo="soporte.soporte_nutricional" variableRes="V123s"
          value={s.soporte_nutricional || '4'} onChange={(v) => set('soporte.soporte_nutricional', v)}
          opciones={[
            {value:'1',label:'1 – Enteral'},{value:'2',label:'2 – Parenteral'},
            {value:'3',label:'3 – Enteral y parenteral'},{value:'4',label:'4 – No recibió'},
            {value:'55',label:'55 – Ente territorial'},
          ]} />
        <Selector label="Terapias complementarias" campo="soporte.terapias_complementarias" variableRes="V124t"
          value={s.terapias_complementarias || '98'} onChange={(v) => set('soporte.terapias_complementarias', v)}
          opciones={[
            {value:'1',label:'1 – Terapia física'},{value:'2',label:'2 – Terapia de lenguaje'},
            {value:'3',label:'3 – Terapia ocupacional'},{value:'4',label:'4 – Pendiente'},
            {value:'5',label:'5 – Física y lenguaje'},{value:'8',label:'8 – Las tres terapias'},
            {value:'55',label:'55 – Ente territorial'},{value:'98',label:'98 – No se han ordenado'},
          ]} />
      </Grid>
    </div>
  );
}

export function SecResultado({ data, set, val }: Props) {
  const r = data.resultado;
  const fallecido = r.estado_vital === '2';
  const desafiliado = r.novedad_administrativa === '5';

  return (
    <div>
      <Grid cols={2}>
        <Selector label="Tipo de tratamiento a fecha de corte" campo="resultado.tipo_tratamiento_corte"
          variableRes="V123" required value={r.tipo_tratamiento_corte}
          onChange={(v) => set('resultado.tipo_tratamiento_corte', v)}
          opciones={CAT.tipo_tratamiento_corte} errores={errs(val,'resultado.tipo_tratamiento_corte')} />
        <Selector label="Resultado del manejo oncológico en el corte" campo="resultado.resultado_oncologico"
          variableRes="V124" required value={r.resultado_oncologico}
          onChange={(v) => set('resultado.resultado_oncologico', v)}
          opciones={CAT.resultado_oncologico} errores={errs(val,'resultado.resultado_oncologico')} />
      </Grid>

      <Grid cols={2}>
        <Selector label="Estado vital al finalizar el corte" campo="resultado.estado_vital"
          variableRes="V125" required value={r.estado_vital}
          onChange={(v) => set('resultado.estado_vital', v)}
          opciones={CAT.estado_vital} errores={errs(val,'resultado.estado_vital')} />
        <Selector label="Novedad administrativa" campo="resultado.novedad_administrativa"
          variableRes="V126" required value={r.novedad_administrativa}
          onChange={(v) => set('resultado.novedad_administrativa', v)}
          opciones={CAT.novedad_administrativa} errores={errs(val,'resultado.novedad_administrativa')} />
      </Grid>

      <Grid cols={2}>
        <Selector label="Novedad clínica" campo="resultado.novedad_clinica"
          variableRes="V127" required value={r.novedad_clinica}
          onChange={(v) => set('resultado.novedad_clinica', v)}
          opciones={CAT.novedad_clinica} errores={errs(val,'resultado.novedad_clinica')} />
        <Campo label="Código BDUA" campo="resultado.codigo_bdua" variableRes="V131"
          value={r.codigo_bdua} onChange={(v) => set('resultado.codigo_bdua', v)} />
      </Grid>

      {desafiliado && (
        <Grid cols={2}>
          <Campo label="Fecha de desafiliación" campo="resultado.fecha_desafiliacion"
            variableRes="V128" required tipo="date" value={r.fecha_desafiliacion}
            onChange={(v) => set('resultado.fecha_desafiliacion', v)}
            errores={errs(val,'resultado.fecha_desafiliacion')} />
        </Grid>
      )}

      {fallecido && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'14px', margin:'10px 0' }}>
          <div style={{ fontWeight:600, fontSize:'12px', color:'#991B1B', marginBottom:'10px' }}>
            ✖ Usuario Fallecido — Campos obligatorios
          </div>
          <Grid cols={2}>
            <Campo label="Fecha de muerte" campo="resultado.fecha_muerte"
              variableRes="V129" required tipo="date" value={r.fecha_muerte === '1845-01-01' ? '' : r.fecha_muerte}
              onChange={(v) => set('resultado.fecha_muerte', v)}
              errores={errs(val,'resultado.fecha_muerte')} />
            <Selector label="Causa de muerte" campo="resultado.causa_muerte"
              variableRes="V130" required value={r.causa_muerte}
              onChange={(v) => set('resultado.causa_muerte', v)}
              opciones={CAT.causa_muerte.filter(o => o.value !== '98')}
              errores={errs(val,'resultado.causa_muerte')} />
          </Grid>
        </div>
      )}

      <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'10px 14px', marginTop:'12px' }}>
        <div style={{ fontSize:'11px', color:'#6B7280' }}>
          Variable 134 (BDUA fecha) — valor fijo requerido:
        </div>
        <div style={{ fontFamily:'monospace', fontSize:'13px', color:'#059669', fontWeight:600 }}>2024-01-01</div>
        {errs(val,'resultado.fecha_bdua').map(e => (
          <div key={e.id_regla} style={{ fontSize:'11.5px', color:'#EF4444', marginTop:'4px' }}>✖ {e.mensaje}</div>
        ))}
      </div>
    </div>
  );
}
