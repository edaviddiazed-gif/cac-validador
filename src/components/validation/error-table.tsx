"use client";

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ValidationError } from "@/lib/validations/types";

const SEVERITY_STYLES = {
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
} as const;

const TYPE_LABELS: Record<string, string> = {
  formato: "Formato",
  rango: "Rango",
  requerido: "Requerido",
  cruce: "Cruzada",
  comodin: "Comodín",
  novedad: "Novedad",
  negocio: "Negocio",
  codificacion: "Codificación",
};

interface ErrorTableProps {
  errors: ValidationError[];
  onExport?: () => void;
}

export function ErrorTable({ errors, onExport }: ErrorTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = errors.filter((e) => {
    const matchSearch =
      search === "" ||
      e.message.toLowerCase().includes(search.toLowerCase()) ||
      e.variableName.toLowerCase().includes(search.toLowerCase()) ||
      String(e.variable).includes(search) ||
      e.reportedValue.toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === "all" || e.type === typeFilter;
    const matchSeverity =
      severityFilter === "all" || e.severity === severityFilter;

    return matchSearch && matchType && matchSeverity;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Errores de Validación
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Buscar por variable, valor o mensaje..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-16">Línea</TableHead>
                <TableHead className="w-20">Variable</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-24">Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="w-20">Severidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {errors.length === 0
                      ? "No se encontraron errores ✅"
                      : "No hay resultados para los filtros aplicados"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, 200).map((error, i) => (
                  <TableRow key={`${error.lineNumber}-${error.variable}-${i}`}>
                    <TableCell className="font-mono text-xs">
                      {error.lineNumber}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      V{error.variable}
                    </TableCell>
                    <TableCell className="text-xs">
                      {error.variableName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[error.type] ?? error.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs">
                      {error.reportedValue || "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px] text-xs">
                      <p className="truncate">{error.message}</p>
                      {error.suggestion && (
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          💡 {error.suggestion}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={SEVERITY_STYLES[error.severity]}>
                        {error.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 200 && (
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            Mostrando 200 de {filtered.length} errores. Exporte para ver todos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
