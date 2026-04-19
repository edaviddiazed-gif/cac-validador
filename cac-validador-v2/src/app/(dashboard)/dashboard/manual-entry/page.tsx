"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { IdentificacionForm } from "@/components/forms/IdentificacionForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Save, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2 } from "lucide-react";

const SECCIONES = [
  { id: "identificacion", label: "1. Identificación", icon: "👤" },
  { id: "diagnostico", label: "2. Diagnóstico", icon: "🔬" },
  { id: "terapia", label: "3. Terapia Sistémica", icon: "💊" },
  { id: "cirugia", label: "4. Cirugía", icon: "🔧" },
  { id: "radioterapia", label: "5. Radioterapia", icon: "☢️" },
  { id: "trasplante", label: "6. Trasplante / Cx Rec.", icon: "🫀" },
  { id: "paliativos", label: "7. Paliativos / Soporte", icon: "🤝" },
  { id: "resultado", label: "8. Resultado y Novedades", icon: "📋" },
];

export default function ManualEntryPage() {
  const { report, setReport } = useAppStore();
  const [activeTab, setActiveTab] = useState("identificacion");
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidar = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/validar-registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      const data = await response.json();
      setValidationResult(data);
    } catch (error) {
      console.error("Error validando:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = SECCIONES.findIndex(s => s.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            📝 Entrada Manual de Datos
          </h1>
          <p className="text-gray-500 mt-1">
            Complete las secciones para validar el reporte de cáncer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="w-4 h-4" /> Guardar Borrador
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg" 
            onClick={handleValidar}
            disabled={loading}
          >
            {loading ? "..." : <Play className="w-4 h-4" />} 
            Validar Registro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar (Desktop) */}
        <Card className="lg:col-span-1 p-2 h-fit hidden lg:block sticky top-6">
          <div className="space-y-1">
            {SECCIONES.map((s) => {
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 border-t">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Resumen de Calidad
            </h3>
            {validationResult ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg flex items-center gap-2 ${validationResult.valido ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {validationResult.valido ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="font-bold text-sm">
                    {validationResult.valido ? "Válido" : `${validationResult.total_errores} Errores`}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No se ha validado aún</p>
            )}
          </div>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-8 min-h-[500px] shadow-sm">
            {activeTab === "identificacion" && <IdentificacionForm />}
            {activeTab !== "identificacion" && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <p className="text-lg font-medium">Sección en proceso de migración</p>
                <p className="text-sm italic">Pronto disponible: {SECCIONES.find(s => s.id === activeTab)?.label}</p>
              </div>
            )}
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              disabled={currentIndex === 0}
              onClick={() => setActiveTab(SECCIONES[currentIndex - 1].id)}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            
            <div className="flex gap-1">
              {SECCIONES.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-indigo-600" : "bg-gray-200"}`} 
                />
              ))}
            </div>

            <Button
              variant="outline"
              disabled={currentIndex === SECCIONES.length - 1}
              onClick={() => setActiveTab(SECCIONES[currentIndex + 1].id)}
              className="gap-2"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
