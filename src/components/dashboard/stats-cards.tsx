"use client";

import {
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  totalRegistros: number;
  registrosValidos: number;
  registrosConError: number;
  porcentajeCalidad: number;
}

export function StatsCards({
  totalRegistros,
  registrosValidos,
  registrosConError,
  porcentajeCalidad,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total Registros",
      value: totalRegistros.toLocaleString("es-CO"),
      icon: FileText,
      color: "text-cac-navy",
      bg: "bg-cac-navy/10",
    },
    {
      title: "Registros Válidos",
      value: registrosValidos.toLocaleString("es-CO"),
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Con Errores",
      value: registrosConError.toLocaleString("es-CO"),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      title: "Calidad de Datos",
      value: `${porcentajeCalidad}%`,
      icon: TrendingUp,
      color: porcentajeCalidad >= 90 ? "text-emerald-600" : "text-cac-orange",
      bg: porcentajeCalidad >= 90 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
