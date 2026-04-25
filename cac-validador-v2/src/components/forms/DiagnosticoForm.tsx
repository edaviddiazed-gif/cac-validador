"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function DiagnosticoForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updateDiagnostico = (field: string, value: any) => {
    setReport({
      ...report,
      diagnostico: {
        ...report.diagnostico,
        [field]: value,
      },
    });
  };

  if (loading) return <div>Cargando catálogos...</div>;

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>🔬</span> 2. Diagnóstico y Estadificación
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Diagnóstico Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Diagnóstico CIE-10 (V17)</label>
            <Input
              value={report.diagnostico?.cie10_neoplasia_primaria || ""}
              onChange={(e) => updateDiagnostico("cie10_neoplasia_primaria", e.target.value.toUpperCase())}
              placeholder="Ej: C50.9 - Tumor maligno de mama"
              className="uppercase"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Fecha Diagnóstico (V18)</label>
            <Input
              type="date"
              value={report.diagnostico?.fecha_diagnostico || ""}
              onChange={(e) => updateDiagnostico("fecha_diagnostico", e.target.value)}
            />
          </div>
        </div>

        {/* Medio y Base Diagnóstico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Medio Diagnóstico (V19)</label>
            <Select
              value={String(report.diagnostico?.medio_diagnostico || "")}
              onValueChange={(v) => updateDiagnostico("medio_diagnostico", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.medio_diagnostico?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                )) || [
                  { value: "1", label: "1 - Histología" },
                  { value: "2", label: "2 - Citología" },
                  { value: "3", label: "3 - Quimioluminiscencia" },
                  { value: "4", label: "4 - PSA" },
                  { value: "5", label: "5 - Marcadores tumorales" },
                  { value: "6", label: "6 - Imagenología" },
                  { value: "7", label: "7 - Otro" },
                  { value: "8", label: "8 - Sin información del autorizado" },
                  { value: "98", label: "98 - Se ignora" },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Base Diagnóstico (V21)</label>
            <Select
              value={String(report.diagnostico?.base_diagnostico || "")}
              onValueChange={(v) => updateDiagnostico("base_diagnostico", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.base_diagnostico?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                )) || [
                  { value: "1", label: "1 - Biopsia" },
                  { value: "2", label: "2 - Citología" },
                  { value: "3", label: "3 - Marcadores tumorales" },
                  { value: "4", label: "4 - Histología + Marcadores" },
                  { value: "5", label: "5 - Imagenología" },
                  { value: "6", label: "6 - Laparotomía exploradora" },
                  { value: "7", label: "7 - PSA" },
                  { value: "98", label: "98 - Se ignora" },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Topografía y Lateralidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Topografía (V20)</label>
            <Input
              value={report.diagnostico?.topografia || ""}
              onChange={(e) => updateDiagnostico("topografia", e.target.value)}
              placeholder="Localización anatómica"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Lateralidad (V23)</label>
            <Select
              value={String(report.diagnostico?.lateralidad || "")}
              onValueChange={(v) => updateDiagnostico("lateralidad", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.lateralidad?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                )) || [
                  { value: "9", label: "9 - No aplica" },
                  { value: "1", label: "1 - Derecho" },
                  { value: "2", label: "2 - Izquierdo" },
                  { value: "3", label: "3 - Bilateral" },
                  { value: "98", label: "98 - Se ignora" },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Histología y Diferenciación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Histología (V27)</label>
            <Select
              value={String(report.diagnostico?.histologia || "")}
              onValueChange={(v) => updateDiagnostico("histologia", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.histologia?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                )) || [
                  { value: "000", label: "000 - No aplica" },
                  { value: "800", label: "800 - Neoplasia maligna, sin precisar" },
                  { value: "801", label: "801 - Carcinoma, sin precisar" },
                  { value: "814", label: "814 - Adenocarcinoma NOS" },
                  { value: "824", label: "824 - Tumor carcinode" },
                  { value: "850", label: "850 - Carcinoma ductal infiltrante" },
                  { value: "999", label: "999 - Se ignora" },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Comportamiento (V28)</label>
            <Select
              value={String(report.diagnostico?.comportamiento || "")}
              onValueChange={(v) => updateDiagnostico("comportamiento", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.comportamiento?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                )) || [
                  { value: "0", label: "0 - Benigno" },
                  { value: "1", label: "1 - Incierto o desconocido" },
                  { value: "2", label: "2 - In situ" },
                  { value: "3", label: "3 - Maligno primario (C80-C94)" },
                  { value: "6", label: "6 - Maligno, maligno primario (C95)" },
                  { value: "9", label: "9 - Maligno, metástasis o secundario (C77-C79)" },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Grado Diferenciación (V22)</label>
            <Select
              value={String(report.diagnostico?.grado_diferenciacion || "")}
              onValueChange={(v) => updateDiagnostico("grado_diferenciacion", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos?.grado_diferenciacion?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                )) || [
                  { value: "1", label: "1 - Bien diferenciado (Grado I)" },
                  { value: "2", label: "2 - Moderadamente diferenciado (Grado II)" },
                  { value: "3", label: "3 - Mal diferenciado (Grado III)" },
                  { value: "4", label: "4 - Indiferenciado (Grado IV)" },
                  { value: "9", label: "9 - No determinado" },
                  { value: "98", label: "98 - Se ignora" },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Estadificación TNM */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-indigo-800 mb-3">Estadificación TNM (Clínica/AP)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Estadificación (V29)</label>
              <Select
                value={String(report.diagnostico?.estadificacion || "")}
                onValueChange={(v) => updateDiagnostico("estadificacion", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.estadificacion?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "00", label: "00 - No aplica" },
                    { value: "99", label: "99 - Se ignora" },
                    { value: "01", label: "01 - EAPB" },
                    { value: "02", label: "02 - IPS - solicitud RIPS AP" },
                    { value: "03", label: "03 - IPS - solicitud como usuario" },
                    { value: "06", label: "06 - Otra IPS" },
                    { value: "07", label: "07 - IPS - resultado AP" },
                    { value: "08", label: "08 - AIS - libre/tumor invasor" },
                    { value: "09", label: "09 - Otro mediano oncohematológico" },
                    { value: "10", label: "10 - Carcinoma in situ" },
                    { value: "11", label: "11 - Estadio I" },
                    { value: "12", label: "12 - Estadio II" },
                    { value: "13", label: "13 - Estadio III" },
                    { value: "14", label: "14 - Estadio IV" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Clasificación TNM (V30)</label>
              <Input
                value={report.diagnostico?.clasificacion_tnm || ""}
                onChange={(e) => updateDiagnostico("clasificacion_tnm", e.target.value)}
                placeholder="Ej: T2N1M0"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Biomarcadores */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-indigo-800 mb-3">Biomarcadores Tumorales TIS-O-Inmunohistoquímica</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">HER2 Realizado (V31)</label>
              <Select
                value={String(report.diagnostico?.her2_realizado || "")}
                onValueChange={(v) => {
                  updateDiagnostico("her2_realizado", v);
                  if (v === "2") {
                    updateDiagnostico("her2_resultado", "98");
                    updateDiagnostico("her2_fecha", "1800-01-01");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.her2_realizado?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "1", label: "1 - Sí" },
                    { value: "2", label: "2 - No" },
                    { value: "98", label: "98 - Se ignora" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {report.diagnostico?.her2_realizado === "1" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Fecha HER2 (V32)</label>
                  <Input
                    type="date"
                    value={report.diagnostico?.her2_fecha || ""}
                    onChange={(e) => updateDiagnostico("her2_fecha", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Resultado HER2 (V33)</label>
                  <Select
                    value={String(report.diagnostico?.her2_resultado || "")}
                    onValueChange={(v) => updateDiagnostico("her2_resultado", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogos?.her2_resultado?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      )) || [
                        { value: "1", label: "1 - Positivo" },
                        { value: "2", label: "2 - Negativo" },
                        { value: "98", label: "98 - Se ignora" },
                      ].map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">RE (V34)</label>
              <Select
                value={String(report.diagnostico?.receptores_estrogeno || "")}
                onValueChange={(v) => updateDiagnostico("receptores_estrogeno", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.receptores_hormonales?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "0", label: "0 - No realizado" },
                    { value: "1", label: "1 - Positivo (%/100)" },
                    { value: "2", label: "2 - Negativo (<1%)" },
                    { value: "98", label: "98 - Se ignora" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">RP (V35)</label>
              <Select
                value={String(report.diagnostico?.receptores_progesterona || "")}
                onValueChange={(v) => updateDiagnostico("receptores_progesterona", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.receptores_hormonales?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "0", label: "0 - No realizado" },
                    { value: "1", label: "1 - Positivo (%/100)" },
                    { value: "2", label: "2 - Negativo (<1%)" },
                    { value: "98", label: "98 - Se ignora" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">KI-67 (V36)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={report.diagnostico?.ki67 || ""}
                onChange={(e) => updateDiagnostico("ki67", e.target.value)}
                placeholder="Porcentaje"
              />
            </div>
          </div>
        </div>

        {/* Tipos específicos */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-indigo-800 mb-3">Estadificación Específica por Tipo Tumoral</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gleason (C61) (V37)</label>
              <Select
                value={String(report.diagnostico?.gleason || "")}
                onValueChange={(v) => updateDiagnostico("gleason", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.gleason?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "000", label: "000 - No aplica" },
                    { value: "020", label: "020 - Gleason 2" },
                    { value: "030", label: "030 - Gleason 3" },
                    { value: "040", label: "040 - Gleason 4" },
                    { value: "050", label: "050 - Gleason 5" },
                    { value: "060", label: "060 - Gleason 6" },
                    { value: "070", label: "070 - Gleason 7" },
                    { value: "080", label: "080 - Gleason 8" },
                    { value: "090", label: "090 - Gleason 9" },
                    { value: "100", label: "100 - Gleason 10" },
                    { value: "999", label: "999 - Se ignora" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">PSA (C61) (V38)</label>
              <Input
                type="number"
                step="0.01"
                value={report.diagnostico?.psa || ""}
                onChange={(e) => updateDiagnostico("psa", e.target.value)}
                placeholder="ng/mL"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ann Arbor (V40)</label>
              <Select
                value={String(report.diagnostico?.estadio_ann_arbor || "")}
                onValueChange={(v) => updateDiagnostico("estadio_ann_arbor", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.estadio_ann_arbor?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "0", label: "0 - No aplica" },
                    { value: "1", label: "1 - Estadio I" },
                    { value: "2", label: "2 - Estadio II" },
                    { value: "3", label: "3 - Estadio III" },
                    { value: "4", label: "4 - Estadio IV" },
                    { value: "98", label: "98 - Se ignora" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">B Síntomas (V41)</label>
              <Select
                value={String(report.diagnostico?.sintomas_b || "")}
                onValueChange={(v) => updateDiagnostico("sintomas_b", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.sintomas_b?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "0", label: "0 - No aplica" },
                    { value: "1", label: "1 - Sí" },
                    { value: "2", label: "2 - No" },
                    { value: "98", label: "98 - Se ignora" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">IPSS (Leucemia) (V42)</label>
              <Select
                value={String(report.diagnostico?.ipss || "")}
                onValueChange={(v) => updateDiagnostico("ipss", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogos?.ipss?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  )) || [
                    { value: "0", label: "0 - No aplica" },
                    { value: "1", label: "1 - Bueno" },
                    { value: "2", label: "2 - Intermedio" },
                    { value: "3", label: "3 - Malo" },
                  ].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Fecha Biopsia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Fecha Biopsia (V24)</label>
            <Input
              type="date"
              value={report.diagnostico?.fecha_biopsia || ""}
              onChange={(e) => updateDiagnostico("fecha_biopsia", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">IPS Diagnóstico (V25)</label>
            <Input
              value={report.diagnostico?.ips_diagnostico || ""}
              onChange={(e) => updateDiagnostico("ips_diagnostico", e.target.value)}
              placeholder="Código IPS"
              maxLength={20}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
