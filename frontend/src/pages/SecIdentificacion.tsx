// src/pages/SecIdentificacion.tsx
import { Campo, Selector, Grid } from '../components/Field';
import { CAT } from '../catalogos';
import type { CACReport, ValidationResponse } from '../types';

interface Props {
  data: CACReport;
  set: (path: string, val: string) => void;
  val: ValidationResponse | null;
  levantadas?: Set<string>;
  onLevantarRegla?: (id: string) => void;
}

function errs(val: ValidationResponse | null, campo: string) {
  return val?.errores_por_campo?.[campo] ?? [];
}

export function SecIdentificacion({ data, set, val, levantadas, onLevantarRegla }: Props) {
  const p = data.paciente;
  const c = data.cabecera;
  return (
    <div>
      <Grid cols={3}>
        <Campo label="ID Reporte" campo="cabecera.id_reporte" value={c.id_reporte}
          onChange={(v) => set('cabecera.id_reporte', v)} placeholder="CAC-2024-00001" />
        <Campo label="Fecha de corte" campo="cabecera.fecha_corte" tipo="date"
          value={c.fecha_corte} onChange={(v) => set('cabecera.fecha_corte', v)} required />
        <Selector label="Fuente" campo="cabecera.fuente" value={c.fuente}
          onChange={(v) => set('cabecera.fuente', v)}
          opciones={[{value:'EAPB',label:'EAPB'},{value:'IPS',label:'IPS'},{value:'DirTerritorial',label:'Dirección Territorial'}]} />
      </Grid>

      <hr style={{ margin: '16px 0', borderColor: '#F3F4F6' }} />

      <Grid cols={2}>
        <Selector label="Tipo de identificación" campo="paciente.tipo_id" variableRes="V5"
          required value={p.tipo_id} onChange={(v) => set('paciente.tipo_id', v)}
          opciones={CAT.tipo_id} errores={errs(val, 'paciente.tipo_id')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Número de identificación" campo="paciente.numero_id" variableRes="V6"
          required value={p.numero_id} onChange={(v) => set('paciente.numero_id', v)}
          errores={errs(val, 'paciente.numero_id')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
      </Grid>

      <Grid cols={2}>
        <Campo label="Primer nombre" campo="paciente.primer_nombre" variableRes="V1"
          required value={p.primer_nombre} onChange={(v) => set('paciente.primer_nombre', v)}
          errores={errs(val, 'paciente.primer_nombre')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Segundo nombre (NONE si no tiene)" campo="paciente.segundo_nombre" variableRes="V2"
          value={p.segundo_nombre} onChange={(v) => set('paciente.segundo_nombre', v)} />
      </Grid>

      <Grid cols={2}>
        <Campo label="Primer apellido" campo="paciente.primer_apellido" variableRes="V3"
          required value={p.primer_apellido} onChange={(v) => set('paciente.primer_apellido', v)}
          errores={errs(val, 'paciente.primer_apellido')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Segundo apellido (NOAP si no tiene)" campo="paciente.segundo_apellido" variableRes="V4"
          value={p.segundo_apellido} onChange={(v) => set('paciente.segundo_apellido', v)} />
      </Grid>

      <Grid cols={3}>
        <Campo label="Fecha de nacimiento" campo="paciente.fecha_nacimiento" variableRes="V7"
          required tipo="date" value={p.fecha_nacimiento}
          onChange={(v) => set('paciente.fecha_nacimiento', v)}
          errores={errs(val, 'paciente.fecha_nacimiento')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Selector label="Sexo" campo="paciente.sexo" variableRes="V8"
          required value={p.sexo} onChange={(v) => set('paciente.sexo', v)}
          opciones={CAT.sexo} errores={errs(val, 'paciente.sexo')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Ocupación (código CIUO)" campo="paciente.ocupacion" variableRes="V9"
          value={p.ocupacion} onChange={(v) => set('paciente.ocupacion', v)}
          placeholder="9999 si desconocido" />
      </Grid>

      <Grid cols={3}>
        <Selector label="Régimen de afiliación" campo="paciente.regimen_afiliacion" variableRes="V10"
          required value={p.regimen_afiliacion} onChange={(v) => set('paciente.regimen_afiliacion', v)}
          opciones={CAT.regimen} errores={errs(val, 'paciente.regimen_afiliacion')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Código EPS / entidad territorial" campo="paciente.codigo_eps" variableRes="V11"
          required value={p.codigo_eps} onChange={(v) => set('paciente.codigo_eps', v)}
          errores={errs(val, 'paciente.codigo_eps')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Municipio residencia (DIVIPOLA 5 díg.)" campo="paciente.municipio_residencia" variableRes="V14"
          required value={p.municipio_residencia} onChange={(v) => set('paciente.municipio_residencia', v)}
          placeholder="11001" errores={errs(val, 'paciente.municipio_residencia')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
      </Grid>

      <Grid cols={3}>
        <Selector label="Pertenencia étnica" campo="paciente.pertenencia_etnica" variableRes="V12"
          required value={p.pertenencia_etnica} onChange={(v) => set('paciente.pertenencia_etnica', v)}
          opciones={CAT.pertenencia_etnica} />
        <Campo label="Grupo poblacional" campo="paciente.grupo_poblacional" variableRes="V13"
          required value={p.grupo_poblacional} onChange={(v) => set('paciente.grupo_poblacional', v)}
          placeholder="35=Trabajador urbano" />
        <Campo label="Teléfono(s)" campo="paciente.telefono" variableRes="V15"
          value={p.telefono} onChange={(v) => set('paciente.telefono', v)}
          placeholder="0 si no hay" />
      </Grid>

      <Grid cols={2}>
        <Campo label="Fecha de afiliación a la EPS" campo="paciente.fecha_afiliacion" variableRes="V16"
          required tipo="date" value={p.fecha_afiliacion}
          onChange={(v) => set('paciente.fecha_afiliacion', v)}
          errores={errs(val, 'paciente.fecha_afiliacion')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
      </Grid>
    </div>
  );
}
