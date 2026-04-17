"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/upload/drop-zone";
import { ProgressLive } from "@/components/validation/progress-live";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ErrorTable } from "@/components/validation/error-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseCAC } from "@/lib/parsers/cac-parser";
import { validateFile, createEmptyCatalogs } from "@/lib/validations/engine";
import type { FileValidationResult } from "@/lib/validations/types";
import { CheckCircle, Upload, RotateCcw } from "lucide-react";

type UploadStep = "select" | "validating" | "results";

export default function UploadPage() {
  const [step, setStep] = useState<UploadStep>("select");
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [result, setResult] = useState<FileValidationResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setStep("validating");
    setResult(null);

    try {
      const text = await file.text();
      const parseResult = parseCAC(text, file.name);
      const total = parseResult.records.length;
      setProgress({ processed: 0, total });

      // Simulate progressive validation with batches
      const batchSize = Math.max(1, Math.floor(total / 20));
      const records = parseResult.records.map((r) => ({
        lineNumber: r.lineNumber,
        record: r.record,
      }));

      let processed = 0;
      for (let i = 0; i < records.length; i += batchSize) {
        await new Promise((r) => setTimeout(r, 50)); // simulate async
        processed = Math.min(i + batchSize, total);
        setProgress({ processed, total });
      }

      // Full validation
      const validationResult = validateFile(records, createEmptyCatalogs());
      setResult(validationResult);
      setProgress({ processed: total, total });
      setStep("results");
    } catch (err) {
      console.error("Validation error:", err);
    }
  }, []);

  const handleReset = () => {
    setStep("select");
    setResult(null);
    setProgress({ processed: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cargar Archivo</h1>
          <p className="text-sm text-muted-foreground">
            Suba su archivo TXT ANSI para validación automática
          </p>
        </div>
        {step !== "select" && (
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Nuevo archivo
          </Button>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[
          { key: "select", label: "Seleccionar" },
          { key: "validating", label: "Validar" },
          { key: "results", label: "Resultados" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-border" />}
            <Badge
              variant={step === s.key ? "default" : "outline"}
              className="gap-1"
            >
              {step === s.key && s.key === "results" && (
                <CheckCircle className="h-3 w-3" />
              )}
              {i + 1}. {s.label}
            </Badge>
          </div>
        ))}
      </div>

      {/* Step: Select */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Seleccione su archivo de reporte CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DropZone onFileSelect={handleFile} />
          </CardContent>
        </Card>
      )}

      {/* Step: Validating */}
      {step === "validating" && (
        <ProgressLive
          processed={progress.processed}
          total={progress.total}
          errorsFound={0}
          isComplete={false}
        />
      )}

      {/* Step: Results */}
      {step === "results" && result && (
        <>
          <StatsCards
            totalRegistros={result.totalRecords}
            registrosValidos={result.validRecords}
            registrosConError={result.invalidRecords}
            porcentajeCalidad={result.qualityPercentage}
          />

          <ProgressLive
            processed={result.totalRecords}
            total={result.totalRecords}
            errorsFound={result.errors.length}
            isComplete={true}
          />

          {result.errors.length > 0 && (
            <ErrorTable errors={result.errors} />
          )}
        </>
      )}
    </div>
  );
}
