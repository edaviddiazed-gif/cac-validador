"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProgressLive } from "@/components/validation/progress-live";
import { ErrorTable } from "@/components/validation/error-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import type { ValidationError } from "@/lib/validations/types";

/** Demo validation errors for preview */
const DEMO_ERRORS: ValidationError[] = [
  {
    lineNumber: 15,
    variable: 17,
    variableName: "Diagnóstico CIE-10",
    ruleName: "cie10_insitu_estadio_coherente",
    type: "cruce",
    severity: "error",
    reportedValue: "D05",
    message: 'CIE-10 "D05" (in situ) pero estadio = 5. Debería ser 0',
    suggestion: "Para diagnóstico in situ (D00-D09), el estadio debe ser 0",
  },
  {
    lineNumber: 42,
    variable: 128,
    variableName: "Novedad administrativa",
    ruleName: "fallecido_requiere_fecha_muerte",
    type: "novedad",
    severity: "error",
    reportedValue: "4",
    message: "V128=4 (fallecido) pero V131 (fecha muerte) está vacía",
    suggestion: "Ingrese la fecha real de muerte del paciente",
  },
  {
    lineNumber: 78,
    variable: 37,
    variableName: "Variable 37",
    ruleName: "gleason_solo_prostata",
    type: "negocio",
    severity: "warning",
    reportedValue: "7",
    message: 'V37 Gleason (7) reportado para CIE-10 no-próstata ("C50.9")',
    suggestion: "Gleason solo aplica para próstata (C61). Use 98 (NA)",
  },
  {
    lineNumber: 103,
    variable: 5,
    variableName: "Tipo de documento",
    ruleName: "tipo_documento_valido",
    type: "rango",
    severity: "error",
    reportedValue: "XX",
    message: 'V5 Tipo documento "XX" no es válido',
    suggestion: "Valores permitidos: RC, TI, CC, CE, PA, MS, AS, CD, SC, PE",
  },
  {
    lineNumber: 155,
    variable: 53,
    variableName: "Variable 53",
    ruleName: "atc_primer_esquema_no_repetidos",
    type: "negocio",
    severity: "error",
    reportedValue: "L01DB01",
    message: "V53 Medicamentos ATC repetidos: L01DB01",
    suggestion: "Cada medicamento ATC debe aparecer una sola vez en el esquema",
  },
];

export default function ValidateDetailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cac-teal" />
              <h1 className="text-xl font-bold tracking-tight font-mono">
                20230505_EPS001_CANCER.txt
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Validación · 1,250 registros · 5 mayo 2023
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Descargar TXT Corregido
          </Button>
        </div>
      </div>

      <StatsCards
        totalRegistros={1250}
        registrosValidos={1205}
        registrosConError={45}
        porcentajeCalidad={96.4}
      />

      <ProgressLive
        processed={1250}
        total={1250}
        errorsFound={5}
        isComplete={true}
      />

      <ErrorTable errors={DEMO_ERRORS} />
    </div>
  );
}
