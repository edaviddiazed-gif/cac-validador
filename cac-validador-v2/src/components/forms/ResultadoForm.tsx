"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ResultadoForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updateField = (field: string, value: any) => {
    setReport({
      ...report,
      [field]: value,
    });
  };

  if (loading) return <div>Cargando catálogos...</div>;

  const estadoVital = String(report.v126_estado_vital || "");

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>📋</span> 8. Resultado y Novedades
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        
        {/* Situación Actual */}
        <div className="border p-4 rounded-md space-y-4 bg-slate-50">
          <h3 className="font-semibold text-indigo-800">Situación Clínica Actual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha Último Contacto (V125)</label>
              <Input 
                type="date"
                value={report.v125_ultimo_contacto || ""}
                onChange={(e) => updateField("v125_ultimo_contacto", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Estado Vital (V126)</label>
              <Select 
                value={estadoVital} 
                onValueChange={(v) => updateField("v126_estado_vital", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  {catalogos?.estado_vital?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    <SelectItem key="1" value="1">1 - Vivo</SelectItem>,
                    <SelectItem key="2" value="2">2 - Fallecido</SelectItem>,
                    <SelectItem key="98" value="98">98 - Se ignora</SelectItem>
                  ]}
                </SelectContent>
              </Select>
            </div>
          </div>

          {estadoVital === "2" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Muerte (V131)</label>
                <Input 
                  type="date"
                  value={report.v131_fecha_muerte || ""}
                  onChange={(e) => updateField("v131_fecha_muerte", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Causa Muerte (V132)</label>
                <Select 
                  value={String(report.v132_causa_muerte || "")} 
                  onValueChange={(v) => updateField("v132_causa_muerte", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Por el cáncer</SelectItem>
                    <SelectItem value="2">2 - Otra causa</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Código CIE-10 Defunción (V133)</label>
                <Input 
                  value={report.v133_codigo_muerte || ""}
                  onChange={(e) => updateField("v133_codigo_muerte", e.target.value.toUpperCase())}
                  placeholder="Ej: C509"
                  maxLength={5}
                  className="uppercase"
                />
              </div>
            </div>
          )}
        </div>

        {/* Novedades y ECOG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="border p-4 rounded-md space-y-4 bg-slate-50">
            <h3 className="font-semibold text-indigo-800">Estado de Funcionalidad</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Escala ECOG (V127)</label>
              <Select 
                value={String(report.v127_ecog || "")} 
                onValueChange={(v) => updateField("v127_ecog", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Activo totalmente</SelectItem>
                  <SelectItem value="1">1 - Restricción trabajo físico</SelectItem>
                  <SelectItem value="2">2 - Ambulatorio, capaz de auto-cuidado</SelectItem>
                  <SelectItem value="3">3 - Confinado a cama o silla &gt;50%</SelectItem>
                  <SelectItem value="4">4 - Totalmente confinado</SelectItem>
                  <SelectItem value="5">5 - Fallecido</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border p-4 rounded-md space-y-4 bg-slate-50">
            <h3 className="font-semibold text-indigo-800">Corte</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha de Corte (V134)</label>
              <Input 
                type="date"
                value={report.v134_fecha_corte || ""}
                onChange={(e) => updateField("v134_fecha_corte", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border p-4 rounded-md space-y-4 bg-slate-50 mt-6">
          <h3 className="font-semibold text-indigo-800">Novedades</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Novedad Administrativa (V128)</label>
              <Select 
                value={String(report.v128_novedad_admin || "")} 
                onValueChange={(v) => updateField("v128_novedad_admin", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Sin novedad</SelectItem>
                  <SelectItem value="1">1 - Traslado EPS</SelectItem>
                  <SelectItem value="2">2 - Régimen subsidiado</SelectItem>
                  <SelectItem value="3">3 - Régimen contributivo</SelectItem>
                  <SelectItem value="4">4 - Falla de identificación</SelectItem>
                  <SelectItem value="5">5 - Alta curada</SelectItem>
                  <SelectItem value="6">6 - Pérdida de seguimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Novedad Clínica (V129)</label>
              <Select 
                value={String(report.v129_novedad_clinica || "")} 
                onValueChange={(v) => updateField("v129_novedad_clinica", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Sin novedad</SelectItem>
                  <SelectItem value="1">1 - Recaída</SelectItem>
                  <SelectItem value="2">2 - Progresión</SelectItem>
                  <SelectItem value="3">3 - Segundo primario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha Novedad (V130)</label>
              <Input 
                type="date"
                value={report.v130_fecha_novedad || ""}
                onChange={(e) => updateField("v130_fecha_novedad", e.target.value)}
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
