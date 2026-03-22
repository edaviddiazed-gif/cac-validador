// src/pages/SecDiagnostico.tsx
import { Campo, Selector, Grid, Alerta } from '../components/Field';
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

function esMama(cie: string)        { return cie.toUpperCase().startsWith('C50'); }
function esColorrectal(cie: string) { return ['C18','C19','C20'].some(p => cie.toUpperCase().startsWith(p)); }
function esProstata(cie: string)    { return cie.toUpperCase().startsWith('C61'); }
function esLinfomaMieloma(cie: string) {
  return ['C81','C82','C83','C84','C85','C90'].some(p => cie.toUpperCase().startsWith(p));
}
function esHematologico(cie: string) {
  return ['C81','C82','C83','C84','C85','C90','C91','C92','C93','C94','C95']
    .some(p => cie.toUpperCase().startsWith(p));
}

export function SecDiagnostico({ data, set, val, levantadas, onLevantarRegla }: Props) {
  const d = data.diagnostico;
  const cie = d.cie10_neoplasia_primaria;
  const sinHisto = d.tipo_estudio_diagnostico === '7';
  const conAntecedente = d.antecedente_otro_cancer === '1';

  return (
    <div>
      {/* ── Datos básicos ── */}
      <Grid cols={2}>
        <Campo label="CIE-10 de la neoplasia primaria" campo="diagnostico.cie10_neoplasia_primaria"
          variableRes="V17" required value={cie}
          onChange={(v) => set('diagnostico.cie10_neoplasia_primaria', v.toUpperCase())}
          placeholder="Ej. C509, C189, C61X" errores={errs(val,'diagnostico.cie10_neoplasia_primaria')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Fecha de diagnóstico" campo="diagnostico.fecha_diagnostico"
          variableRes="V18" required tipo="date" value={d.fecha_diagnostico}
          onChange={(v) => set('diagnostico.fecha_diagnostico', v)}
          errores={errs(val,'diagnostico.fecha_diagnostico')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
      </Grid>

      <Grid cols={2}>
        <Campo label="Fecha nota de remisión" campo="diagnostico.fecha_remision"
          variableRes="V19" tipo="date" value={d.fecha_remision}
          onChange={(v) => set('diagnostico.fecha_remision', v)}
          errores={errs(val,'diagnostico.fecha_remision')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Campo label="Fecha ingreso IPS diagnóstico" campo="diagnostico.fecha_ingreso_ips"
          variableRes="V20" tipo="date" value={d.fecha_ingreso_ips}
          onChange={(v) => set('diagnostico.fecha_ingreso_ips', v)}
          errores={errs(val,'diagnostico.fecha_ingreso_ips')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
      </Grid>

      <Grid cols={2}>
        <Selector label="Tipo de estudio diagnóstico" campo="diagnostico.tipo_estudio_diagnostico"
          variableRes="V21" required value={d.tipo_estudio_diagnostico}
          onChange={(v) => set('diagnostico.tipo_estudio_diagnostico', v)}
          opciones={CAT.tipo_estudio} errores={errs(val,'diagnostico.tipo_estudio_diagnostico')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        {sinHisto ? (
          <Selector label="Motivo sin histopatología" campo="diagnostico.motivo_sin_histopatologia"
            variableRes="V22" required value={d.motivo_sin_histopatologia}
            onChange={(v) => set('diagnostico.motivo_sin_histopatologia', v)}
            opciones={CAT.motivo_sin_histo.filter(o => !['98'].includes(o.value))}
            errores={errs(val,'diagnostico.motivo_sin_histopatologia')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        ) : (
          <div />
        )}
      </Grid>

      {/* Histopatología — ocultar si tipo=7 */}
      {!sinHisto && (
        <>
          <Alerta tipo="info" texto="El diagnóstico incluyó histopatología. Complete las fechas de muestra e informe." />
          <Grid cols={3}>
            <Campo label="Fecha recolección muestra" campo="diagnostico.fecha_recoleccion_muestra"
              variableRes="V23" required tipo="date" value={d.fecha_recoleccion_muestra}
              onChange={(v) => set('diagnostico.fecha_recoleccion_muestra', v)}
              errores={errs(val,'diagnostico.fecha_recoleccion_muestra')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
            <Campo label="Fecha informe histopatológico" campo="diagnostico.fecha_informe_histopatologico"
              variableRes="V24" required tipo="date" value={d.fecha_informe_histopatologico}
              onChange={(v) => set('diagnostico.fecha_informe_histopatologico', v)}
              errores={errs(val,'diagnostico.fecha_informe_histopatologico')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
            <Campo label="Código IPS confirmadora (REPS)" campo="diagnostico.codigo_ips_confirmadora"
              variableRes="V25" value={d.codigo_ips_confirmadora}
              onChange={(v) => set('diagnostico.codigo_ips_confirmadora', v)}
              placeholder="96=fuera país, 98=sin histo" errores={errs(val,'diagnostico.codigo_ips_confirmadora')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
          </Grid>
        </>
      )}

      <Grid cols={2}>
        <Campo label="Fecha 1ª consulta médico tratante" campo="diagnostico.fecha_primera_consulta_tratante"
          variableRes="V26" tipo="date" value={d.fecha_primera_consulta_tratante}
          onChange={(v) => set('diagnostico.fecha_primera_consulta_tratante', v)}
          errores={errs(val,'diagnostico.fecha_primera_consulta_tratante')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Selector label="Histología del tumor" campo="diagnostico.histologia"
          variableRes="V27" value={d.histologia}
          onChange={(v) => set('diagnostico.histologia', v)} opciones={CAT.histologia} />
      </Grid>

      <Grid cols={2}>
        <Selector label="Grado de diferenciación" campo="diagnostico.grado_diferenciacion"
          variableRes="V28" value={d.grado_diferenciacion}
          onChange={(v) => set('diagnostico.grado_diferenciacion', v)}
          opciones={CAT.grado_diferenciacion} />
        {!esHematologico(cie) && (
          <Campo label="Estadificación TNM/FIGO" campo="diagnostico.estadificacion_tnm"
            variableRes="V29" value={d.estadificacion_tnm}
            onChange={(v) => set('diagnostico.estadificacion_tnm', v)}
            placeholder="Código numérico según tumor" errores={errs(val,'diagnostico.estadificacion_tnm')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        )}
      </Grid>

      {/* V30 — Fecha estadificación TNM (aplica si V29 tiene valor y no es hematológico) */}
      {!esHematologico(cie) && d.estadificacion_tnm && d.estadificacion_tnm !== '98' && d.estadificacion_tnm !== '99' && (
        <Grid cols={2}>
          <Campo label="Fecha estadificación TNM/FIGO" campo="diagnostico.fecha_estadificacion_tnm"
            variableRes="V30" tipo="date" value={d.fecha_estadificacion_tnm}
            onChange={(v) => set('diagnostico.fecha_estadificacion_tnm', v)}
            errores={errs(val,'diagnostico.fecha_estadificacion_tnm')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
          <div />
        </Grid>
      )}

      {/* ── Estadificaciones específicas ── */}

      {/* HER2 — solo mama */}
      {esMama(cie) && (
        <div style={{ background:'#FFF7F7', border:'1px solid #FECACA', borderRadius:'8px', padding:'14px', margin:'12px 0' }}>
          <div style={{ fontWeight:600, fontSize:'12px', color:'#991B1B', marginBottom:'10px' }}>
            🎀 Cáncer de Mama — HER2
          </div>
          <Grid cols={3}>
            <Selector label="¿Se realizó prueba HER2?" campo="diagnostico.her2_realizado"
              variableRes="V31" required value={d.her2_realizado}
              onChange={(v) => set('diagnostico.her2_realizado', v)}
              opciones={CAT.her2_realizado.filter(o => !['98'].includes(o.value))}
              errores={errs(val,'diagnostico.her2_realizado')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
            {d.her2_realizado === '1' && (
              <Campo label="Fecha última prueba HER2" campo="diagnostico.fecha_her2"
                variableRes="V32" tipo="date" value={d.fecha_her2}
                onChange={(v) => set('diagnostico.fecha_her2', v)} />
            )}
            {d.her2_realizado === '1' && (
              <Selector label="Resultado HER2" campo="diagnostico.resultado_her2"
                variableRes="V33" value={d.resultado_her2}
                onChange={(v) => set('diagnostico.resultado_her2', v)}
                opciones={CAT.resultado_her2.filter(o => !['97','98'].includes(o.value))}
                errores={errs(val,'diagnostico.resultado_her2')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
            )}
          </Grid>
        </div>
      )}

      {/* Dukes — solo colorrectal */}
      {esColorrectal(cie) && (
        <div style={{ background:'#F0FFF4', border:'1px solid #BBF7D0', borderRadius:'8px', padding:'14px', margin:'12px 0' }}>
          <div style={{ fontWeight:600, fontSize:'12px', color:'#166534', marginBottom:'10px' }}>
            🟢 Cáncer Colorrectal — Estadificación Dukes
          </div>
          <Grid cols={2}>
            <Selector label="Estadificación de Dukes" campo="diagnostico.estadificacion_dukes"
              variableRes="V34" required value={d.estadificacion_dukes}
              onChange={(v) => set('diagnostico.estadificacion_dukes', v)}
              opciones={CAT.dukes.filter(o => !['98'].includes(o.value))}
              errores={errs(val,'diagnostico.estadificacion_dukes')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
            <Campo label="Fecha estadificación Dukes" campo="diagnostico.fecha_dukes"
              variableRes="V35" tipo="date" value={d.fecha_dukes ?? ''}
              onChange={(v) => set('diagnostico.fecha_dukes', v)}
              errores={errs(val,'diagnostico.fecha_dukes')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
          </Grid>
        </div>
      )}

      {/* Ann Arbor — linfoma/mieloma */}
      {esLinfomaMieloma(cie) && (
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'14px', margin:'12px 0' }}>
          <div style={{ fontWeight:600, fontSize:'12px', color:'#1E40AF', marginBottom:'10px' }}>
            🔵 Linfoma / Mieloma — Ann Arbor / Lugano
          </div>
          <Selector label="Estadificación Ann Arbor / Lugano" campo="diagnostico.ann_arbor_lugano"
            variableRes="V36" required value={d.ann_arbor_lugano}
            onChange={(v) => set('diagnostico.ann_arbor_lugano', v)}
            opciones={CAT.ann_arbor.filter(o => !['98'].includes(o.value))}
            errores={errs(val,'diagnostico.ann_arbor_lugano')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        </div>
      )}

      {/* Clasificación de riesgo + fecha — leucemias/linfomas/sólidos pediátricos */}
      {esHematologico(cie) && (
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'14px', margin:'12px 0' }}>
          <div style={{ fontWeight:600, fontSize:'12px', color:'#1E40AF', marginBottom:'10px' }}>
            🔵 Clasificación de Riesgo
          </div>
          <Grid cols={2}>
            <Selector label="Clasificación de riesgo" campo="diagnostico.clasificacion_riesgo"
              variableRes="V38" value={d.clasificacion_riesgo}
              onChange={(v) => set('diagnostico.clasificacion_riesgo', v)}
              opciones={CAT.clasificacion_riesgo ?? []}
              errores={errs(val,'diagnostico.clasificacion_riesgo')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
            <Campo label="Fecha clasificación de riesgo" campo="diagnostico.fecha_clasificacion_riesgo"
              variableRes="V39" tipo="date" value={d.fecha_clasificacion_riesgo ?? ''}
              onChange={(v) => set('diagnostico.fecha_clasificacion_riesgo', v)}
              errores={errs(val,'diagnostico.fecha_clasificacion_riesgo')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
          </Grid>
        </div>
      )}

      {/* Gleason — próstata */}
      {esProstata(cie) && (
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:'8px', padding:'14px', margin:'12px 0' }}>
          <div style={{ fontWeight:600, fontSize:'12px', color:'#9A3412', marginBottom:'10px' }}>
            🟠 Cáncer de Próstata — Escala Gleason
          </div>
          <Selector label="Clasificación Gleason" campo="diagnostico.gleason"
            variableRes="V37" required value={d.gleason}
            onChange={(v) => set('diagnostico.gleason', v)}
            opciones={CAT.gleason.filter(o => !['98'].includes(o.value))}
            errores={errs(val,'diagnostico.gleason')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        </div>
      )}

      <hr style={{ margin: '16px 0', borderColor: '#F3F4F6' }} />

      {/* Objetivos y antecedentes */}
      <Grid cols={2}>
        <Selector label="Objetivo inicial del tratamiento" campo="diagnostico.objetivo_inicial"
          variableRes="V40" required value={d.objetivo_inicial}
          onChange={(v) => set('diagnostico.objetivo_inicial', v)} opciones={CAT.objetivo}
          errores={errs(val,'diagnostico.objetivo_inicial')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        <Selector label="Objetivo del período de reporte" campo="diagnostico.objetivo_periodo"
          variableRes="V41" required value={d.objetivo_periodo}
          onChange={(v) => set('diagnostico.objetivo_periodo', v)} opciones={CAT.objetivo_periodo}
          errores={errs(val,'diagnostico.objetivo_periodo')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
      </Grid>

      <Grid cols={2}>
        <Selector label="¿Tiene antecedente de otro cáncer primario?" campo="diagnostico.antecedente_otro_cancer"
          variableRes="V42" required value={d.antecedente_otro_cancer}
          onChange={(v) => set('diagnostico.antecedente_otro_cancer', v)} opciones={CAT.si_no}
          errores={errs(val,'diagnostico.antecedente_otro_cancer')} levantadas={levantadas} onLevantarRegla={onLevantarRegla} />
        {conAntecedente && (
          <Campo label="Fecha diagnóstico otro cáncer" campo="diagnostico.fecha_otro_cancer"
            variableRes="V43" tipo="date" value={d.fecha_otro_cancer}
            onChange={(v) => set('diagnostico.fecha_otro_cancer', v)} />
        )}
      </Grid>
      {conAntecedente && (
        <Grid cols={2}>
          <Campo label="CIE-10 del otro cáncer primario" campo="diagnostico.cie10_otro_cancer"
            variableRes="V44" value={d.cie10_otro_cancer}
            onChange={(v) => set('diagnostico.cie10_otro_cancer', v.toUpperCase())} />
        </Grid>
      )}
    </div>
  );
}
