"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Info, Download } from "lucide-react";

interface ValidationStats {
  totalRegistros: number;
  registrosValidos: number;
  registrosConError: number;
  porcentajeCalidad: number;
  erroresPorVariable: Record<number, number>;
  tiempoValidacionMs: number;
}

export default function ValidatePage() {
  const searchParams = useSearchParams();
  const reporteId = searchParams.get("reporteId");

  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reporteId) {
      setError("No se especificó ID de reporte");
      setLoading(false);
      return;
    }

    // Simular polling de estado de validación
    const timer = setTimeout(() => {
      setStats({
        totalRegistros: 2450,
        registrosValidos: 2100,
        registrosConError: 350,
        porcentajeCalidad: 85.7,
        erroresPorVariable: {
          128: 45,
          17: 32,
          18: 28,
          131: 25,
          134: 22,
          126: 18,
        },
        tiempoValidacionMs: 2500,
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [reporteId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-bold text-red-900">Error</h2>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8 flex items-center justify-center">
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
            </div>
            <p className="text-gray-600 font-medium">Validando archivo...</p>
            <p className="text-sm text-gray-500">
              Por favor espera mientras se procesan los registros
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            🔍 Resultados de Validación
          </h1>
          <p className="text-gray-600 mt-2">
            Reporte: <code className="bg-gray-100 px-2 py-1 rounded">{reporteId}</code>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-gray-600">Total Registros</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {stats?.totalRegistros.toLocaleString()}
            </div>
          </Card>
          <Card className="p-6 border-green-300 bg-green-50">
            <div className="text-sm text-green-700">Válidos</div>
            <div className="text-3xl font-bold text-green-900 mt-1">
              {stats?.registrosValidos.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-2">
              {stats && ((stats.registrosValidos / stats.totalRegistros) * 100).toFixed(1)}%
            </p>
          </Card>
          <Card className="p-6 border-red-300 bg-red-50">
            <div className="text-sm text-red-700">Con Errores</div>
            <div className="text-3xl font-bold text-red-900 mt-1">
              {stats?.registrosConError.toLocaleString()}
            </div>
            <p className="text-xs text-red-600 mt-2">
              {stats && ((stats.registrosConError / stats.totalRegistros) * 100).toFixed(1)}%
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Calidad</div>
            <div className="text-3xl font-bold text-indigo-600 mt-1">
              {stats?.porcentajeCalidad.toFixed(1)}%
            </div>
            <Progress
              value={stats?.porcentajeCalidad || 0}
              className="mt-3 h-2"
            />
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Detail */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 Desglose de Validación
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Registros Procesados</span>
                  <span className="font-medium text-gray-900">
                    {stats?.totalRegistros}/{stats?.totalRegistros}
                  </span>
                </div>
                <Progress value={100} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Válidos</p>
                    <p className="font-bold text-lg">
                      {((stats?.registrosValidos || 0) / (stats?.totalRegistros || 1)).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Warnings</p>
                    <p className="font-bold text-lg">
                      {((stats?.registrosConError || 0) / (stats?.totalRegistros || 1)).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                <div className="flex gap-2 items-start">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    <strong>Tiempo de validación:</strong> {stats?.tiempoValidacionMs}ms (
                    {(
                      (stats?.totalRegistros || 0) /
                      ((stats?.tiempoValidacionMs || 1) / 1000)
                    ).toFixed(0)}{" "}
                    registros/seg)
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Errors */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🔴 Errores Principales
            </h2>
            <div className="space-y-3">
              {stats?.erroresPorVariable &&
                Object.entries(stats.erroresPorVariable)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([varNum, count]) => (
                    <div
                      key={varNum}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900">V{varNum}</p>
                        <p className="text-xs text-gray-500">
                          {["V128: Novedad", "V17: CIE-10", "V18: Fecha Diag", "V131: Fecha Muerte"][
                            Object.keys(stats.erroresPorVariable).indexOf(varNum)
                          ] || "Variable"}
                        </p>
                      </div>
                      <span className="font-bold text-red-600">{count}</span>
                    </div>
                  ))}
            </div>
          </Card>
        </div>

        {/* Actions */}
        <Card className="p-6">
          <div className="flex gap-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {}}>
              <Download className="w-4 h-4 mr-2" />
              Descargar Reporte JSON
            </Button>
            <Button variant="outline">Ver Detalle de Errores</Button>
            <Button variant="outline">Exportar a Excel</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
