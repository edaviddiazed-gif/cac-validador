"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function PaliativosForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updateField = (field: string, value: any) => {
    setReport({
      ...report,
      [field]: value,
    });
  };

  if (loading) return <div>Cargando catálogos...</div>;

  const valoradoPaliativo = String(report.v113_paliativo || "");

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>🤝</span> 7. Cuidado Paliativo y Soporte
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        
        {/* Cuidado Paliativo */}
        <div className="border p-4 rounded-md space-y-4 bg-slate-50">
          <h3 className="font-semibold text-indigo-800">Cuidado Paliativo Médico</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Valorado en Paliativos (V113)</label>
              <Select 
                value={valoradoPaliativo} 
                onValueChange={(v) => updateField("v113_paliativo", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {valoradoPaliativo === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Inicio Paliativos (V114)</label>
                <Input 
                  type="date"
                  value={report.v114_fecha_inicio_paliativo || ""}
                  onChange={(e) => updateField("v114_fecha_inicio_paliativo", e.target.value)}
                />
              </div>
            )}
          </div>

          {valoradoPaliativo === "1" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">IPS Cuidado Paliativo (V115)</label>
                <Input 
                  value={report.v115_ips_paliativo || ""}
                  onChange={(e) => updateField("v115_ips_paliativo", e.target.value)}
                  placeholder="Código IPS"
                  maxLength={20}
                />
              </div>
            </div>
          )}
        </div>

        {/* Soporte Nutricional y Psicológico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="border p-4 rounded-md space-y-4 bg-slate-50">
            <h3 className="font-semibold text-indigo-800">Soporte Nutricional</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Valoración Nutricional (V116)</label>
              <Select 
                value={String(report.v116_nutricion || "")} 
                onValueChange={(v) => updateField("v116_nutricion", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {String(report.v116_nutricion) === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Nutrición (V117)</label>
                <Input 
                  type="date"
                  value={report.v117_fecha_nutricion || ""}
                  onChange={(e) => updateField("v117_fecha_nutricion", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="border p-4 rounded-md space-y-4 bg-slate-50">
            <h3 className="font-semibold text-indigo-800">Soporte Psicológico</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Valoración Psicológica (V118)</label>
              <Select 
                value={String(report.v118_psicologia || "")} 
                onValueChange={(v) => updateField("v118_psicologia", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {String(report.v118_psicologia) === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Psicología (V119)</label>
                <Input 
                  type="date"
                  value={report.v119_fecha_psicologia || ""}
                  onChange={(e) => updateField("v119_fecha_psicologia", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Rehabilitación y Dolor */}
        <div className="border p-4 rounded-md space-y-4 bg-slate-50 mt-6">
          <h3 className="font-semibold text-indigo-800">Rehabilitación y Control del Dolor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rehabilitación Oncológica (V120)</label>
              <Select 
                value={String(report.v120_rehabilitacion || "")} 
                onValueChange={(v) => updateField("v120_rehabilitacion", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {String(report.v120_rehabilitacion) === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Rehabilitación (V121)</label>
                <Input 
                  type="date"
                  value={report.v121_fecha_rehabilitacion || ""}
                  onChange={(e) => updateField("v121_fecha_rehabilitacion", e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Paliativo Domiciliario (V122)</label>
              <Select 
                value={String(report.v122_cuidado_paliativo_domiciliario || "")} 
                onValueChange={(v) => updateField("v122_cuidado_paliativo_domiciliario", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Navegación Pacientes (V123)</label>
              <Select 
                value={String(report.v123_navegacion || "")} 
                onValueChange={(v) => updateField("v123_navegacion", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Control del Dolor (V124)</label>
              <Select 
                value={String(report.v124_dolor || "")} 
                onValueChange={(v) => updateField("v124_dolor", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Adecuado</SelectItem>
                  <SelectItem value="2">2 - Inadecuado</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
