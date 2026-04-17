"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Download, Eye, Trash2 } from "lucide-react";

interface Report {
  id: string;
  archivo: string;
  periodo: string;
  estado: "validado" | "validando" | "error";
  totalRegistros: number;
  registrosValidos: number;
  fechaCarga: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: "rep-001",
      archivo: "ABC_EPS_2023_001.txt",
      periodo: "2023-01",
      estado: "validado",
      totalRegistros: 2450,
      registrosValidos: 2100,
      fechaCarga: "2023-05-01",
    },
    {
      id: "rep-002",
      archivo: "XYZ_SALUD_2023_001.txt",
      periodo: "2023-01",
      estado: "validando",
      totalRegistros: 1850,
      registrosValidos: 1550,
      fechaCarga: "2023-05-02",
    },
    {
      id: "rep-003",
      archivo: "DEF_EPS_2023_001.txt",
      periodo: "2023-01",
      estado: "error",
      totalRegistros: 500,
      registrosValidos: 0,
      fechaCarga: "2023-05-03",
    },
  ]);

  const [filtro, setFiltro] = useState("todos");

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "validado":
        return <span className="w-2 h-2 bg-green-600 rounded-full inline-block mr-2" />;
      case "validando":
        return <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block mr-2 animate-pulse" />;
      case "error":
        return <span className="w-2 h-2 bg-red-600 rounded-full inline-block mr-2" />;
      default:
        return null;
    }
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      validado: "✅ Validado",
      validando: "⏳ Validando",
      error: "❌ Error",
    };
    return labels[estado] || estado;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            📊 Mis Reportes CAC
          </h1>
          <p className="text-gray-600 mt-2">
            Historial de carga y validación de archivos
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <Input type="month" defaultValue="2023-01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="todos">Todos</option>
                <option value="validado">Validado</option>
                <option value="validando">Validando</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Buscar
              </Button>
            </div>
          </div>
        </Card>

        {/* Reports Table */}
        <Card className="overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Archivo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Registros
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Calidad
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {report.archivo}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {report.periodo}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">
                        {getEstadoIcon(report.estado)}
                        {getEstadoLabel(report.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {report.totalRegistros.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full"
                            style={{
                              width: `${(report.registrosValidos / report.totalRegistros) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {((report.registrosValidos / report.totalRegistros) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.fechaCarga).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => console.log("Ver", report.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => console.log("Descargar", report.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setReports(
                              reports.filter((r) => r.id !== report.id)
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Empty State */}
        {reports.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No hay reportes para mostrar</p>
          </Card>
        )}
      </div>
    </div>
  );
}
