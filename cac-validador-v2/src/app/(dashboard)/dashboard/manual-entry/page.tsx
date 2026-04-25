"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { IdentificacionForm } from "@/components/forms/IdentificacionForm";
import { DiagnosticoForm } from "@/components/forms/DiagnosticoForm";
import { TerapiaSistemicaForm } from "@/components/forms/TerapiaSistemicaForm";
import { CirugiaForm } from "@/components/forms/CirugiaForm";
import { RadioterapiaForm } from "@/components/forms/RadioterapiaForm";
import { TrasplanteForm } from "@/components/forms/TrasplanteForm";
import { PaliativosForm } from "@/components/forms/PaliativosForm";
import { ResultadoForm } from "@/components/forms/ResultadoForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Save, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { validateRecord, createEmptyCatalogs } from "@/lib/validations";
import type { CACRecord } from "@/types/cac";

const SECCIONES = [
  { id: "identificacion", label: "1. Identificación", icon: "👤" },
  { id: "diagnostico", label: "2. Diagnóstico", icon: "🔬" },
  { id: "terapia", label: "3. Terapia Sistémica", icon: "💊" },
  { id: "cirugia", label: "4. Cirugía", icon: "🔧" },
  { id: "radioterapia", label: "5. Radioterapia", icon: "☢️" },
  { id: "trasplante", label: "6. Trasplante / Cx Rec.", icon: "🫀" },
  { id: "paliativos", label: "7. Paliativos / Soporte", icon: "🤝" },
  { id: "resultado", label: "8. Resultado y Novedades", icon: "📋" },
];

export default function ManualEntryPage() {
  const { report, setReport } = useAppStore();
  const [activeTab, setActiveTab] = useState("identificacion");
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidar = async () => {
    setLoading(true);
    try {
      // Map nested legacy state (for forms 1-3) and flat root state (forms 4-8) to a single flat CACRecord
      const p = report.paciente || {};
      const d = report.diagnostico || {};
      const t = report.terapia_sistemica || {};
      
      const record: any = {
        // Flat fields injected by new forms (v74 to v134)
        ...report,
        
        // Identificacion
        v01_primer_nombre: p.primer_nombre,
        v02_segundo_nombre: p.segundo_nombre,
        v03_primer_apellido: p.primer_apellido,
        v04_segundo_apellido: p.segundo_apellido,
        v05_tipo_id: p.tipo_id,
        v06_numero_id: p.num_id,
        v07_fecha_nacimiento: p.fecha_nacimiento,
        v08_sexo: p.sexo,
        v10_regimen: p.regimen,
        
        // Diagnostico
        v17_cie10: d.cie10_neoplasia_primaria,
        v18_fecha_diagnostico: d.fecha_diagnostico,
        v19_medio_diagnostico: d.medio_diagnostico,
        v20_topografia: d.topografia,
        v21_base_diagnostico: d.base_diagnostico,
        v22_grado_diferenciacion: d.grado_diferenciacion,
        v23_lateralidad: d.lateralidad,
        v24_fecha_biopsia: d.fecha_biopsia,
        v25_ips_diagnostico: d.ips_diagnostico,
        v27_histologia: d.histologia,
        v28_comportamiento: d.comportamiento,
        v29_estadificacion: d.estadificacion,
        v30_clasificacion_tnm: d.clasificacion_tnm,
        v31_her2_realizado: d.her2_realizado,
        v32_her2_fecha: d.her2_fecha,
        v33_her2_resultado: d.her2_resultado,
        v34_receptores_estrogeno: d.receptores_estrogeno,
        v35_receptores_progesterona: d.receptores_progesterona,
        v36_ki67: d.ki67,
        v37_gleason: d.gleason,
        v38_psa: d.psa,
        v40_estadio_ann_arbor: d.estadio_ann_arbor,
        v41_sintomas_b: d.sintomas_b,
        v42_ipss: d.ipss,
        
        // Terapia
        v45_recibio_qs: t.recibio_qt,
        v46_fecha_inicio_qs: t.quimio?.fecha_inicio,
        v47_num_ciclos: t.quimio?.num_ciclos,
        v48_intencion_primer_esquema: t.quimio?.intencion,
        v51_fecha_inicio_ultimo_esquema: t.ultimo_esquema?.fecha_inicio,
        v57_num_ciclos_ultimo: t.ultimo_esquema?.num_ciclos,
        v58_fecha_ultimo_ciclo: t.ultimo_esquema?.fecha_ultimo_ciclo,
        v59_estado_esquema: t.quimio?.estado,
        v60_recibio_hormonoterapia: t.hormonoterapia?.recibio,
        v61_fecha_inicio_hormono: t.hormonoterapia?.fecha_inicio,
        v62_tipo_hormono: t.hormonoterapia?.tipo,
        v67_estado_hormono: t.hormonoterapia?.estado,
        v68_recibio_inmunoterapia: t.inmunoterapia?.recibio,
        v69_fecha_inicio_inmuno: t.inmunoterapia?.fecha_inicio,
        v73_estado_inmuno: t.inmunoterapia?.estado,
      };

      // Map ATCs for first scheme (v53_1 to v53_8)
      if (t.quimio?.meds_atc) {
        t.quimio.meds_atc.forEach((val: string, i: number) => {
          if (i < 8) record[`v53_${i+1}_med_atc_primer`] = val;
        });
      }
      
      // Map ATCs for last scheme (v54 to v56)
      if (t.ultimo_esquema?.meds_atc) {
        t.ultimo_esquema.meds_atc.forEach((val: string, i: number) => {
          if (i < 3) record[`v${54+i}_med_atc_ultimo_${i+1}`] = val;
        });
      }

      const context = { catalogos: createEmptyCatalogs() };
      const errors = validateRecord(record as CACRecord, 1, context);
      const realErrors = errors.filter((e) => e.severity !== "info");
      setValidationResult({
        valido: realErrors.length === 0,
        total_errores: realErrors.filter((e) => e.severity === "error").length,
        total_advertencias: realErrors.filter((e) => e.severity === "warning").length,
        errores: errors,
      });
    } catch (error) {
      console.error("Error validando:", error);
      setValidationResult({
        valido: false,
        total_errores: 1,
        total_advertencias: 0,
        errores: [{ message: "Error interno de validación" }],
      });
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = SECCIONES.findIndex(s => s.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            📝 Entrada Manual de Datos
          </h1>
          <p className="text-gray-500 mt-1">
            Complete las secciones para validar el reporte de cáncer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="w-4 h-4" /> Guardar Borrador
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg" 
            onClick={handleValidar}
            disabled={loading}
          >
            {loading ? "..." : <Play className="w-4 h-4" />} 
            Validar Registro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar (Desktop) */}
        <Card className="lg:col-span-1 p-2 h-fit hidden lg:block sticky top-6">
          <div className="space-y-1">
            {SECCIONES.map((s) => {
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 border-t">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Resumen de Calidad
            </h3>
            {validationResult ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg flex items-center gap-2 ${validationResult.valido ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {validationResult.valido ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="font-bold text-sm">
                    {validationResult.valido ? "Válido" : `${validationResult.total_errores} Errores`}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No se ha validado aún</p>
            )}
          </div>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-8 min-h-[500px] shadow-sm">
            {activeTab === "identificacion" && <IdentificacionForm />}
            {activeTab === "diagnostico" && <DiagnosticoForm />}
            {activeTab === "terapia" && <TerapiaSistemicaForm />}
            {activeTab === "cirugia" && <CirugiaForm />}
            {activeTab === "radioterapia" && <RadioterapiaForm />}
            {activeTab === "trasplante" && <TrasplanteForm />}
            {activeTab === "paliativos" && <PaliativosForm />}
            {activeTab === "resultado" && <ResultadoForm />}
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              disabled={currentIndex === 0}
              onClick={() => setActiveTab(SECCIONES[currentIndex - 1].id)}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            
            <div className="flex gap-1">
              {SECCIONES.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-indigo-600" : "bg-gray-200"}`} 
                />
              ))}
            </div>

            <Button
              variant="outline"
              disabled={currentIndex === SECCIONES.length - 1}
              onClick={() => setActiveTab(SECCIONES[currentIndex + 1].id)}
              className="gap-2"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
