"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TrasplanteForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updateField = (field: string, value: any) => {
    setReport({
      ...report,
      [field]: value,
    });
  };

  if (loading) return <div>Cargando catálogos...</div>;

  const recibioTrasplante = String(report.v106_recibio_trasplante || "");
  const recibioReconstructiva = String(report.v111_reconstructiva || "");

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>🫀</span> 6. Trasplante y Cx. Reconstructiva
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        
        {/* Trasplante de Progenitores Hematopoyeticos */}
        <div className="border p-4 rounded-md space-y-4 bg-slate-50">
          <h3 className="font-semibold text-indigo-800">Trasplante de Células Progenitoras</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recibió Trasplante (V106)</label>
              <Select 
                value={recibioTrasplante} 
                onValueChange={(v) => updateField("v106_recibio_trasplante", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recibioTrasplante === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha de Trasplante (V107)</label>
                <Input 
                  type="date"
                  value={report.v107_fecha_trasplante || ""}
                  onChange={(e) => updateField("v107_fecha_trasplante", e.target.value)}
                />
              </div>
            )}
          </div>

          {recibioTrasplante === "1" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo de Trasplante (V108)</label>
                <Select 
                  value={String(report.v108_tipo_trasplante || "")} 
                  onValueChange={(v) => updateField("v108_tipo_trasplante", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Autólogo</SelectItem>
                    <SelectItem value="2">2 - Alogénico emparentado</SelectItem>
                    <SelectItem value="3">3 - Alogénico no emparentado</SelectItem>
                    <SelectItem value="4">4 - Haploidéntico</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">IPS Trasplante (V109)</label>
                <Input 
                  value={report.v109_ips_trasplante || ""}
                  onChange={(e) => updateField("v109_ips_trasplante", e.target.value)}
                  placeholder="Código IPS"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado del Trasplante (V110)</label>
                <Select 
                  value={String(report.v110_estado_trasplante || "")} 
                  onValueChange={(v) => updateField("v110_estado_trasplante", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Exitoso</SelectItem>
                    <SelectItem value="2">2 - Falla de injerto</SelectItem>
                    <SelectItem value="3">3 - Recaída</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Cirugía Reconstructiva */}
        <div className="border p-4 rounded-md space-y-4 bg-slate-50 mt-6">
          <h3 className="font-semibold text-indigo-800">Cirugía Reconstructiva</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recibió Cx Reconstructiva (V111)</label>
              <Select 
                value={recibioReconstructiva} 
                onValueChange={(v) => updateField("v111_reconstructiva", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recibioReconstructiva === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Cx Reconstructiva (V112)</label>
                <Input 
                  type="date"
                  value={report.v112_fecha_reconstructiva || ""}
                  onChange={(e) => updateField("v112_fecha_reconstructiva", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
