"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CirugiaForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updateField = (field: string, value: any) => {
    setReport({
      ...report,
      [field]: value,
    });
  };

  if (loading) return <div>Cargando catálogos...</div>;

  const recibio = String(report.v74_recibio_cirugia || "");

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>🔧</span> 4. Cirugía Oncológica
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recibió Cirugía Oncológica (V74)</label>
            <Select 
              value={recibio} 
              onValueChange={(v) => updateField("v74_recibio_cirugia", v)}
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
              <label className="text-sm font-medium text-gray-700">Fecha Cirugía Principal (V75)</label>
              <Input 
                type="date"
                value={report.v75_fecha_cirugia || ""}
                onChange={(e) => updateField("v75_fecha_cirugia", e.target.value)}
              />
            </div>
          )}
        </div>

        {recibio === "1" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CUPS Cirugía Principal (V76)</label>
                <Input 
                  value={report.v76_cups_cirugia || ""}
                  onChange={(e) => updateField("v76_cups_cirugia", e.target.value.toUpperCase())}
                  placeholder="Ej: 854101"
                  maxLength={6}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Intención de la Cirugía (V79)</label>
                <Select 
                  value={String(report.v79_intencion_cirugia || "")} 
                  onValueChange={(v) => updateField("v79_intencion_cirugia", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Curativa</SelectItem>
                    <SelectItem value="2">2 - Paliativa</SelectItem>
                    <SelectItem value="3">3 - Diagnóstica</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">IPS donde se realizó (V77)</label>
                <Input 
                  value={report.v77_ips_cirugia || ""}
                  onChange={(e) => updateField("v77_ips_cirugia", e.target.value)}
                  placeholder="Código IPS"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Margen Quirúrgico (V83)</label>
                <Select 
                  value={String(report.v83_margen_quirurgico || "")} 
                  onValueChange={(v) => updateField("v83_margen_quirurgico", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - R0 (Sin tumor residual)</SelectItem>
                    <SelectItem value="2">2 - R1 (Tumor residual microscópico)</SelectItem>
                    <SelectItem value="3">3 - R2 (Tumor residual macroscópico)</SelectItem>
                    <SelectItem value="4">4 - Rx (No valorable)</SelectItem>
                    <SelectItem value="9">9 - No aplica</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha última cirugía (V80)</label>
                <Input 
                  type="date"
                  value={report.v80_fecha_ultima_cirugia || ""}
                  onChange={(e) => updateField("v80_fecha_ultima_cirugia", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CUPS última cirugía (V81)</label>
                <Input 
                  value={report.v81_cups_ultima_cirugia || ""}
                  onChange={(e) => updateField("v81_cups_ultima_cirugia", e.target.value.toUpperCase())}
                  placeholder="Ej: 854101"
                  maxLength={6}
                  className="uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado Post Cirugía (V82)</label>
                <Select 
                  value={String(report.v82_estado_post_cirugia || "")} 
                  onValueChange={(v) => updateField("v82_estado_post_cirugia", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Recuperación</SelectItem>
                    <SelectItem value="2">2 - Complicaciones</SelectItem>
                    <SelectItem value="3">3 - Fallecido</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ganglios Evaluados (V84)</label>
                <Input 
                  type="number"
                  value={report.v84_ganglios_evaluados || ""}
                  onChange={(e) => updateField("v84_ganglios_evaluados", parseInt(e.target.value))}
                  min={0}
                  placeholder="Cantidad"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ganglios Positivos (V85)</label>
                <Input 
                  type="number"
                  value={report.v85_ganglios_positivos || ""}
                  onChange={(e) => updateField("v85_ganglios_positivos", parseInt(e.target.value))}
                  min={0}
                  placeholder="Cantidad"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
