"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle } from "lucide-react";

interface ProgressLiveProps {
  processed: number;
  total: number;
  errorsFound: number;
  isComplete: boolean;
}

export function ProgressLive({
  processed,
  total,
  errorsFound,
  isComplete,
}: ProgressLiveProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {isComplete ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-cac-teal" />
            )}
            {isComplete ? "Validación completada" : "Validando..."}
          </CardTitle>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {processed.toLocaleString("es-CO")} / {total.toLocaleString("es-CO")} registros
          </span>
          <span className={errorsFound > 0 ? "text-red-500 font-medium" : ""}>
            {errorsFound.toLocaleString("es-CO")} errores
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
