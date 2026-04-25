/**
 * /reports/[id] — Vista de detalle de un reporte individual.
 * Muestra resumen ejecutivo, errores por variable, tabla de errores,
 * y acciones de re-validación y exportación.
 *
 * @module app/(dashboard)/reports/[id]/page
 */
"use client";

import { useState, useEffect, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  Download,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface ReporteDetalle {
  id: string;
  archivo: string;
  periodo: string;
  estado: string;
  totalRegistros: number;
  registrosValidos: number;
  registrosConError: number;
  totalErrores: number;
  totalAdvertencias: number;
  fechaCarga: string;
  fechaValidacion: string | null;
  eapbCodigo: string;
  eapbNombre: string;
}

interface ErrorItem {
  variable_numero: number;
  variable_nombre: string;
  tipo_error: string;
  mensaje_error: string;
  sugerencia: string | null;
  valor_reportado: string | null;
}

interface Resumen {
  erroresPorTipo: Record<string, number>;
  topVariables: { variable: number; count: number }[];
}

// ─── Componentes auxiliares ────────────────────────────────────────────────

function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold tabular-nums text-gray-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const colors: Record<string, string> = {
    formato: "bg-blue-100 text-blue-800",
    rango: "bg-purple-100 text-purple-800",
    requerido: "bg-red-100 text-red-800",
    cruce: "bg-orange-100 text-orange-800",
    codificacion: "bg-teal-100 text-teal-800",
    negocio: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[tipo] ?? "bg-gray-100 text-gray-700"}`}
    >
      {tipo}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { userId } = useAuth();
  const [reporte, setReporte] = useState<ReporteDetalle | null>(null);
  const [errores, setErrores] = useState<ErrorItem[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reportes/${id}`, {
          headers: { "x-user-id": userId! },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setReporte(data.reporte);
        setErrores(data.errores ?? []);
        setResumen(data.resumen ?? null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [userId, id]);

  const handleExport = async (format: "txt" | "pdf" | "excel") => {
    if (!userId) return;
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ reporteId: id, format, onlyValid: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(err.error);
      }
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
        toast({ title: "Descarga iniciada", variant: "success" });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      toast({
        title: "Error de exportación",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // ── Loading / Error ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" />
        Cargando detalle del reporte…
      </div>
    );
  }

  if (error || !reporte) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">
          Error al cargar reporte
        </h2>
        <p className="text-gray-500">{error ?? "Reporte no encontrado"}</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const calidad =
    reporte.totalRegistros > 0
      ? Math.round(
          (reporte.registrosValidos / reporte.totalRegistros) * 100,
        )
      : 0;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📋 {reporte.archivo}
            </h1>
            <p className="text-sm text-gray-500">
              Período: {reporte.periodo} · EAPB: {reporte.eapbNombre} (
              {reporte.eapbCodigo})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("txt")}
          >
            <FileText className="w-4 h-4 mr-1" /> TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("excel")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
          >
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Registros"
          value={reporte.totalRegistros}
          icon={BarChart3}
          color="bg-indigo-500"
        />
        <KPICard
          label="Válidos"
          value={reporte.registrosValidos}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <KPICard
          label="Con Error"
          value={reporte.registrosConError}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <KPICard
          label="Calidad"
          value={`${calidad}%`}
          icon={BarChart3}
          color={calidad >= 90 ? "bg-emerald-500" : calidad >= 70 ? "bg-yellow-500" : "bg-red-500"}
        />
      </div>

      {/* Top Variables con Errores */}
      {resumen && resumen.topVariables.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔝 Top Variables con Errores
          </h2>
          <div className="space-y-3">
            {resumen.topVariables.map((tv, i) => {
              const pct =
                reporte.totalRegistros > 0
                  ? Math.round((tv.count / reporte.totalRegistros) * 100)
                  : 0;
              return (
                <div key={tv.variable} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 w-6 text-right">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-medium text-gray-700 w-16">
                    V{tv.variable}
                  </span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-24 text-right">
                    {tv.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Errores por Tipo */}
      {resumen && Object.keys(resumen.erroresPorTipo).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Distribución por Tipo de Error
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(resumen.erroresPorTipo)
              .sort(([, a], [, b]) => b - a)
              .map(([tipo, count]) => (
                <div
                  key={tipo}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border"
                >
                  <TipoBadge tipo={tipo} />
                  <span className="text-sm font-bold text-gray-700 tabular-nums">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Tabla de Errores Detallada */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            📝 Detalle de Errores ({errores.length.toLocaleString()})
          </h2>
        </div>
        {errores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <p className="text-sm font-medium">
              Sin errores de validación registrados
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  {["Variable", "Tipo", "Valor Reportado", "Error", "Sugerencia"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {errores.slice(0, 200).map((e, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono font-semibold text-indigo-700">
                          V{e.variable_numero}
                        </span>
                        <span className="text-xs text-gray-400 ml-1 block">
                          {e.variable_nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TipoBadge tipo={e.tipo_error} />
                    </td>
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        {e.valor_reportado ?? "—"}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      {e.mensaje_error}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                      {e.sugerencia ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errores.length > 200 && (
              <div className="px-4 py-3 bg-yellow-50 text-xs text-yellow-700 border-t">
                Mostrando 200 de {errores.length.toLocaleString()} errores.
                Exporte a Excel para ver todos.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Metadata */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-400">
          <span>
            Cargado:{" "}
            {new Date(reporte.fechaCarga).toLocaleString("es-CO")}
          </span>
          {reporte.fechaValidacion && (
            <span>
              Validado:{" "}
              {new Date(reporte.fechaValidacion).toLocaleString("es-CO")}
            </span>
          )}
          <span>ID: {reporte.id}</span>
        </div>
      </Card>
    </div>
  );
}
