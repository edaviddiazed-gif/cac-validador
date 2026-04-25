/**
 * /reports — Página de reportes con integración real a /api/export
 * Reemplaza la versión mock de v2 con datos reales desde Supabase
 * y botones de descarga funcionales.
 *
 * @module app/(dashboard)/reports/page
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  archivo: string;
  periodo: string;
  estado: "validado" | "validando" | "error" | "pendiente";
  totalRegistros: number;
  registrosValidos: number;
  errores: number;
  advertencias: number;
  fechaCarga: string;
  eapbCodigo: string;
}

type ExportFormat = "txt" | "pdf" | "excel";

// ─── Helpers visuales ──────────────────────────────────────────────────────

function BadgeEstado({ estado }: { estado: Report["estado"] }) {
  const cfg: Record<Report["estado"], { label: string; classes: string }> = {
    validado:  { label: "✅ Validado",  classes: "bg-green-100 text-green-800" },
    validando: { label: "⏳ Validando", classes: "bg-yellow-100 text-yellow-800 animate-pulse" },
    error:     { label: "❌ Error",     classes: "bg-red-100 text-red-800" },
    pendiente: { label: "🕐 Pendiente", classes: "bg-gray-100 text-gray-600" },
  };
  const { label, classes } = cfg[estado] ?? cfg.pendiente;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function QualityBar({ total, valid }: { total: number; valid: number }) {
  const pct = total > 0 ? Math.round((valid / total) * 100) : 0;
  const color = pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{pct}%</span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function ReportsPage() {
  const { userId } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Carga de reportes desde Supabase ─────────────────────────────────
  const fetchReports = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ userId });
      if (filtroEstado !== "todos") params.set("estado", filtroEstado);
      if (filtroPeriodo) params.set("periodo", filtroPeriodo);

      const res = await fetch(`/api/reportes?${params.toString()}`, {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setReports(data.reportes ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      toast({ title: "Error cargando reportes", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, filtroEstado, filtroPeriodo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Descarga de reporte en formato elegido ────────────────────────────
  const handleDownload = async (report: Report, format: ExportFormat) => {
    if (!userId) return;
    const key = `${report.id}-${format}`;
    setDownloading(key);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ reporteId: report.id, format, onlyValid: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const ext = format === "excel" ? "xlsx" : format;
      const period = report.periodo.replace(/-/g, "");
      const filename = `${period}_${report.eapbCodigo}_CANCER.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Descarga lista: ${filename}`, variant: "success" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al descargar";
      toast({ title: "Error en descarga", description: msg, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  // ── Eliminar reporte ──────────────────────────────────────────────────
  const handleDelete = async (reportId: string) => {
    if (!userId) return;
    if (!confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/reportes/${reportId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast({ title: "Reporte eliminado", variant: "success" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al eliminar";
      toast({ title: "Error al eliminar", description: msg, variant: "destructive" });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Mis Reportes CAC</h1>
            <p className="text-gray-500 text-sm mt-1">Historial de carga y validación de archivos</p>
          </div>
          <Button variant="outline" onClick={fetchReports} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <input
                type="month"
                value={filtroPeriodo}
                onChange={e => setFiltroPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="todos">Todos</option>
                <option value="validado">Validado</option>
                <option value="validando">Validando</option>
                <option value="error">Error</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchReports} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Buscar
              </Button>
            </div>
          </div>
        </Card>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Tabla */}
        <Card className="overflow-hidden shadow">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-3" />
              Cargando reportes…
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <FileText className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">No se encontraron reportes</p>
              <p className="text-xs">Cargue un archivo .txt desde la pestaña Validador</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    {["Archivo","Período","Estado","Registros","Errores","Calidad","Fecha","Acciones"]
                      .map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{r.archivo}</code>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.periodo}</td>
                      <td className="px-4 py-3"><BadgeEstado estado={r.estado} /></td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">
                        {r.totalRegistros.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 text-xs">
                          {r.errores > 0 && (
                            <span className="text-red-600 font-medium">
                              ❌ {r.errores.toLocaleString()}
                            </span>
                          )}
                          {r.advertencias > 0 && (
                            <span className="text-yellow-600 font-medium">
                              ⚠️ {r.advertencias.toLocaleString()}
                            </span>
                          )}
                          {r.errores === 0 && r.advertencias === 0 && (
                            <span className="text-green-600">Limpio</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <QualityBar total={r.totalRegistros} valid={r.registrosValidos} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(r.fechaCarga).toLocaleDateString("es-CO")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm" variant="outline"
                            title="Ver detalle"
                            onClick={() => window.location.assign(`/reports/${r.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            title="Descargar TXT ANSI (SISCAC)"
                            disabled={downloading === `${r.id}-txt` || r.estado !== "validado"}
                            onClick={() => handleDownload(r, "txt")}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            title="Descargar Excel"
                            disabled={downloading === `${r.id}-excel`}
                            onClick={() => handleDownload(r, "excel")}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            title="Descargar PDF ejecutivo"
                            disabled={downloading === `${r.id}-pdf`}
                            onClick={() => handleDownload(r, "pdf")}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            title="Eliminar reporte"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Resumen */}
        {reports.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total reportes", value: reports.length, color: "text-gray-900" },
              { label: "Validados", value: reports.filter(r => r.estado === "validado").length, color: "text-green-700" },
              { label: "Con errores", value: reports.filter(r => r.estado === "error").length, color: "text-red-700" },
              {
                label: "Calidad promedio",
                value: `${Math.round(reports.filter(r => r.totalRegistros > 0)
                  .reduce((acc, r) => acc + (r.registrosValidos / r.totalRegistros) * 100, 0)
                  / Math.max(1, reports.filter(r => r.totalRegistros > 0).length))}%`,
                color: "text-indigo-700"
              },
            ].map(({ label, value, color }) => (
              <Card key={label} className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
