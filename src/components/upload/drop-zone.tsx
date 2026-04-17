"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CAC_FILENAME_REGEX = /^\d{8}_[A-Z0-9]{5,10}_CANCER\.txt$/;

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function DropZone({ onFileSelect, isUploading }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    setFileError(null);

    if (!file.name.endsWith(".txt")) {
      setFileError("Solo se aceptan archivos .txt");
      return false;
    }

    if (!CAC_FILENAME_REGEX.test(file.name)) {
      setFileError(
        `Nombre de archivo inválido. Patrón esperado: AAAAMMDD_CODEAPB_CANCER.txt`,
      );
      return false;
    }

    if (file.size > 500 * 1024 * 1024) {
      setFileError("El archivo excede 500MB");
      return false;
    }

    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200",
          dragActive && "border-cac-teal bg-cac-teal/5 scale-[1.01]",
          fileError && "border-destructive/50",
          selectedFile && !fileError && "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/10",
        )}
      >
        <CardContent className="p-0">
          <label
            htmlFor="file-upload"
            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 p-8"
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {/* Icon */}
            <div className={cn(
              "rounded-full p-4 transition-colors",
              selectedFile && !fileError ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted",
            )}>
              {selectedFile && !fileError ? (
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Text */}
            {selectedFile && !fileError ? (
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cac-teal" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <Badge variant="secondary">{formatSize(selectedFile.size)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Archivo listo para validación
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium">
                  Arrastre su archivo aquí o{" "}
                  <span className="text-cac-teal underline">seleccione</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Formato: AAAAMMDD_CODEAPB_CANCER.txt · Máx 500MB
                </p>
              </div>
            )}

            <input
              id="file-upload"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleInput}
              disabled={isUploading}
            />
          </label>
        </CardContent>
      </Card>

      {/* Error */}
      {fileError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Error en el archivo</p>
            <p>{fileError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
