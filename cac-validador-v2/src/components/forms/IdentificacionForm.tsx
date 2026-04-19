"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label"; // Check if Label exists, otherwise use <label>

export function IdentificacionForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updatePaciente = (field: string, value: any) => {
    setReport({
      ...report,
      paciente: {
        ...report.paciente,
        [field]: value,
      },
    });
  };

  if (loading) return <div>Cargando catálogos...</div>;

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>👤</span> 1. Identificación del Paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primer Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Primer Nombre (V1)</label>
            <Input 
              value={report.paciente.primer_nombre}
              onChange={(e) => updatePaciente("primer_nombre", e.target.value)}
              placeholder="Ej: JUAN"
              className="uppercase"
            />
          </div>

          {/* Segundo Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Segundo Nombre (V2)</label>
            <Input 
              value={report.paciente.segundo_nombre}
              onChange={(e) => updatePaciente("segundo_nombre", e.target.value)}
              placeholder="Ej: CARLOS o NONE"
              className="uppercase"
            />
          </div>

          {/* Primer Apellido */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Primer Apellido (V3)</label>
            <Input 
              value={report.paciente.primer_apellido}
              onChange={(e) => updatePaciente("primer_apellido", e.target.value)}
              placeholder="Ej: PEREZ"
              className="uppercase"
            />
          </div>

          {/* Segundo Apellido */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Segundo Apellido (V4)</label>
            <Input 
              value={report.paciente.segundo_apellido}
              onChange={(e) => updatePaciente("segundo_apellido", e.target.value)}
              placeholder="Ej: RODRIGUEZ o NOAP"
              className="uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tipo Identificación */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo ID (V5)</label>
            <Select 
              value={report.paciente.tipo_id} 
              onValueChange={(v) => updatePaciente("tipo_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.tipo_id.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Número Identificación */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Número ID (V6)</label>
            <Input 
              value={report.paciente.num_id}
              onChange={(e) => updatePaciente("num_id", e.target.value)}
              placeholder="Ej: 12345678"
            />
          </div>

          {/* Sexo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sexo (V8)</label>
            <Select 
              value={report.paciente.sexo} 
              onValueChange={(v) => updatePaciente("sexo", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.sexo.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha Nacimiento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Fecha Nacimiento (V7)</label>
            <Input 
              type="date"
              value={report.paciente.fecha_nacimiento}
              onChange={(e) => updatePaciente("fecha_nacimiento", e.target.value)}
            />
          </div>

          {/* Régimen */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Régimen (V10)</label>
            <Select 
              value={report.paciente.regimen} 
              onValueChange={(v) => updatePaciente("regimen", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.regimen.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
