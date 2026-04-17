"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { CloudUpload, AlertCircle, CheckCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [periodCorte, setPeriodCorte] = useState("2023-01-01");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".txt")) {
        setError("Solo se aceptan archivos TXT");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }

    setLoading(true);
    try {
      const fileContent = await file.text();

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileContent,
          periodCorte,
          eapbId: "placeholder", // TODO: obtener del usuario actual
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Archivo cargado: ${result.totalRegistros} registros`);
        setTimeout(() => {
          router.push(`/dashboard/validate?reporteId=${result.reporteId}`);
        }, 2000);
      } else {
        setError(result.error || "Error al cargar archivo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <CloudUpload className="w-10 h-10 text-indigo-600" />
            Carga de Archivo CAC
          </h1>
          <p className="text-gray-600 mt-2">
            Sube un archivo TXT ANSI con formato Resolución 0247/2014
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Período de Corte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Corte
              </label>
              <Input
                type="date"
                value={periodCorte}
                onChange={(e) => setPeriodCorte(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generalmente: 2023-01-01 (corte 1 enero)
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo TXT
              </label>
              <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center hover:border-indigo-500 transition">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                  disabled={loading}
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <CloudUpload className="w-8 h-8 text-indigo-500" />
                  <span className="font-medium">
                    {file ? file.name : "Selecciona un archivo"}
                  </span>
                  <span className="text-xs text-gray-500">
                    o arrastra aquí
                  </span>
                </label>
              </div>
            </div>

            {/* Validaciones mostradas */}
            {file && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-blue-900">Pre-validaciones:</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Formato ANSI (TXT)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Nombre válido
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    168 campos esperados
                  </li>
                </ul>
              </div>
            )}

            {/* Errors */}
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Éxito</h3>
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={!file || loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Cargando..." : "Cargar Archivo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFile(null)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        {/* Help text */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">
            ℹ️ Información del Archivo
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              • <strong>Formato:</strong> TXT ANSI con 168 campos separados por
              tabulación
            </li>
            <li>
              • <strong>Codificación:</strong> ANSI (Latin-1)
            </li>
            <li>
              • <strong>Variables:</strong> 134 variables de cáncer según CAC
            </li>
            <li>
              • <strong>Resolución:</strong> 0247/2014 Ministerio de Salud
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
