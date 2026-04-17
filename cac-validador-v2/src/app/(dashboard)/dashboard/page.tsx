"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Clock, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

/** Demo data — will be replaced with Supabase queries */
const DEMO_REPORTES = [
  {
    id: "1",
    nombre: "20230505_EPS001_CANCER.txt",
    estado: "validado" as const,
    registros: 1250,
    errores: 45,
    fecha: "2023-05-05",
  },
  {
    id: "2",
    nombre: "20230505_EPS002_CANCER.txt",
    estado: "pendiente" as const,
    registros: 890,
    errores: 0,
    fecha: "2023-05-04",
  },
];

const ESTADO_BADGE = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  validando: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  validado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  exportado: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resolución 0247/2014 · Medición 2023
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Cargar Archivo
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <StatsCards
        totalRegistros={2140}
        registrosValidos={2095}
        registrosConError={45}
        porcentajeCalidad={97.9}
      />

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Últimos Reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_REPORTES.map((reporte) => (
              <div
                key={reporte.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium font-mono">
                      {reporte.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reporte.registros.toLocaleString("es-CO")} registros ·{" "}
                      {reporte.fecha}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={ESTADO_BADGE[reporte.estado]}>
                    {reporte.estado}
                  </Badge>
                  {reporte.errores > 0 && (
                    <Badge variant="destructive">{reporte.errores} errores</Badge>
                  )}
                  <Link href={`/dashboard/validate/${reporte.id}`}>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
