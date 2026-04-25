"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function RadioterapiaForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updateField = (field: string, value: any) => {
    setReport({
      ...report,
      [field]: value,
    });
  };

  if (loading) return <div>Cargando catálogos...</div>;

  const recibio = String(report.v86_recibio_radioterapia || "");
  const recibioBr = String(report.v100_recibio_braquiterapia || "");

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>☢️</span> 5. Radioterapia
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recibió Radioterapia (V86)</label>
            <Select 
              value={recibio} 
              onValueChange={(v) => updateField("v86_recibio_radioterapia", v)}
            >
              <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Sí</SelectItem>
                <SelectItem value="2">2 - No</SelectItem>
                <SelectItem value="98">98 - Se ignora</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {recibio === "1" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha Inicio RT (V87)</label>
              <Input 
                type="date"
                value={report.v87_fecha_inicio_rt || ""}
                onChange={(e) => updateField("v87_fecha_inicio_rt", e.target.value)}
              />
            </div>
          )}
        </div>

        {recibio === "1" && (
          <div className="border p-4 rounded-md space-y-4 bg-slate-50">
            <h3 className="font-semibold text-indigo-800">Teleterapia Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo RT (V88)</label>
                <Select 
                  value={String(report.v88_tipo_rt || "")} 
                  onValueChange={(v) => updateField("v88_tipo_rt", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - 2D</SelectItem>
                    <SelectItem value="2">2 - 3D</SelectItem>
                    <SelectItem value="3">3 - IMRT</SelectItem>
                    <SelectItem value="4">4 - SBRT / Estereotáctica</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dosis Total cGy (V89)</label>
                <Input 
                  type="number"
                  value={report.v89_dosis_total_rt || ""}
                  onChange={(e) => updateField("v89_dosis_total_rt", parseInt(e.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Num. Sesiones (V90)</label>
                <Input 
                  type="number"
                  value={report.v90_num_sesiones_rt || ""}
                  onChange={(e) => updateField("v90_num_sesiones_rt", parseInt(e.target.value))}
                  min={0}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">IPS RT (V91)</label>
                <Input 
                  value={report.v91_ips_rt || ""}
                  onChange={(e) => updateField("v91_ips_rt", e.target.value)}
                  placeholder="Código IPS"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Intención RT (V93)</label>
                <Select 
                  value={String(report.v93_intencion_rt || "")} 
                  onValueChange={(v) => updateField("v93_intencion_rt", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Curativa</SelectItem>
                    <SelectItem value="2">2 - Paliativa</SelectItem>
                    <SelectItem value="3">3 - Neoadyuvante</SelectItem>
                    <SelectItem value="4">4 - Adyuvante</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="border p-4 rounded-md space-y-4 bg-slate-50 mt-6">
          <h3 className="font-semibold text-indigo-800">Braquiterapia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recibió Braquiterapia (V100)</label>
              <Select 
                value={recibioBr} 
                onValueChange={(v) => updateField("v100_recibio_braquiterapia", v)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recibioBr === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Braquiterapia (V101)</label>
                <Input 
                  type="date"
                  value={report.v101_fecha_braquiterapia || ""}
                  onChange={(e) => updateField("v101_fecha_braquiterapia", e.target.value)}
                />
              </div>
            )}
          </div>
          
          {recibioBr === "1" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo Braquiterapia (V102)</label>
                <Select 
                  value={String(report.v102_tipo_braquiterapia || "")} 
                  onValueChange={(v) => updateField("v102_tipo_braquiterapia", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Alta Tasa Dosis</SelectItem>
                    <SelectItem value="2">2 - Baja Tasa Dosis</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dosis Total (V103)</label>
                <Input 
                  type="number"
                  value={report.v103_dosis_braquiterapia || ""}
                  onChange={(e) => updateField("v103_dosis_braquiterapia", parseInt(e.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sesiones (V104)</label>
                <Input 
                  type="number"
                  value={report.v104_sesiones_braquiterapia || ""}
                  onChange={(e) => updateField("v104_sesiones_braquiterapia", parseInt(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
