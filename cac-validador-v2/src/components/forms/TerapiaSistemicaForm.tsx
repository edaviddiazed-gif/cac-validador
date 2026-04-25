"use client";

import { useAppStore } from "@/lib/store";
import { useCatalogos } from "@/lib/hooks/use-catalogos";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TerapiaSistemicaForm() {
  const { report, setReport } = useAppStore();
  const { catalogos, loading } = useCatalogos();

  const updateTerapia = (field: string, value: any) => {
    setReport({
      ...report,
      terapia_sistemica: {
        ...report.terapia_sistemica,
        [field]: value,
      },
    });
  };

  const updateQuimio = (field: string, value: any) => {
    setReport({
      ...report,
      terapia_sistemica: {
        ...report.terapia_sistemica,
        quimio: {
          ...report.terapia_sistemica?.quimio,
          [field]: value,
        },
      },
    });
  };

  const updateUltimoEsquema = (field: string, value: any) => {
    setReport({
      ...report,
      terapia_sistemica: {
        ...report.terapia_sistemica,
        ultimo_esquema: {
          ...report.terapia_sistemica?.ultimo_esquema,
          [field]: value,
        },
      },
    });
  };

  const updateHormono = (field: string, value: any) => {
    setReport({
      ...report,
      terapia_sistemica: {
        ...report.terapia_sistemica,
        hormonoterapia: {
          ...report.terapia_sistemica?.hormonoterapia,
          [field]: value,
        },
      },
    });
  };

  const updateInmuno = (field: string, value: any) => {
    setReport({
      ...report,
      terapia_sistemica: {
        ...report.terapia_sistemica,
        inmunoterapia: {
          ...report.terapia_sistemica?.inmunoterapia,
          [field]: value,
        },
      },
    });
  };

  const updateMedATC = (index: number, value: string) => {
    const meds = [...(report.terapia_sistemica?.quimio?.meds_atc || ["", "", "", "", "", "", "", ""])];
    meds[index] = value;
    updateQuimio("meds_atc", meds);
  };

  const updateUltimoATC = (index: number, value: string) => {
    const meds = [...(report.terapia_sistemica?.ultimo_esquema?.meds_atc || ["", "", "", "", ""])];
    meds[index] = value;
    updateUltimoEsquema("meds_atc", meds);
  };

  const updateHormonoATC = (index: number, value: string) => {
    const meds = [...(report.terapia_sistemica?.hormonoterapia?.meds_atc || ["", "", ""])];
    meds[index] = value;
    updateHormono("meds_atc", meds);
  };

  const updateInmunoATC = (index: number, value: string) => {
    const meds = [...(report.terapia_sistemica?.inmunoterapia?.meds_atc || ["", ""])];
    meds[index] = value;
    updateInmuno("meds_atc", meds);
  };

  if (loading) return <div>Cargando catálogos...</div>;

  const recibioQt = report.terapia_sistemica?.recibio_qt || "98";

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>💊</span> 3. Terapia Sistémica
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Qumioterapia */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-indigo-800 mb-4 text-lg">Quimioterapia</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recibió QT (V45)</label>
              <Select
                value={recibioQt}
                onValueChange={(v) => {
                  updateTerapia("recibio_qt", v);
                  if (v === "2") {
                    updateTerapia("quimio", null);
                    updateTerapia("ultimo_esquema", null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recibioQt === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Inicio QT (V46)</label>
                <Input
                  type="date"
                  value={report.terapia_sistemica?.quimio?.fecha_inicio || ""}
                  onChange={(e) => updateQuimio("fecha_inicio", e.target.value)}
                />
              </div>
            )}
          </div>

          {recibioQt === "1" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Núm. Ciclos (V47)</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={report.terapia_sistemica?.quimio?.num_ciclos || ""}
                    onChange={(e) => updateQuimio("num_ciclos", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Intención (V48)</label>
                  <Select
                    value={String(report.terapia_sistemica?.quimio?.intencion || "")}
                    onValueChange={(v) => updateQuimio("intencion", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Curativa</SelectItem>
                      <SelectItem value="2">2 - Paliativa</SelectItem>
                      <SelectItem value="3">3 - Neoadyuvante</SelectItem>
                      <SelectItem value="4">4 - Adyuvante</SelectItem>
                      <SelectItem value="98">98 - Se ignora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Estado (V59)</label>
                  <Select
                    value={String(report.terapia_sistemica?.quimio?.estado || "")}
                    onValueChange={(v) => updateQuimio("estado", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Finalizado</SelectItem>
                      <SelectItem value="2">2 - En curso</SelectItem>
                      <SelectItem value="3">3 - No completado</SelectItem>
                      <SelectItem value="4">4 - Suspendido</SelectItem>
                      <SelectItem value="98">98 - Se ignora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Medicamentos ATC Primer Esquema */}
              <div className="border rounded p-3 bg-white">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Medicamentos ATC - Primer Esquema (V53.x)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-xs text-gray-500">V53.{i + 1}</label>
                      <Input
                        value={report.terapia_sistemica?.quimio?.meds_atc?.[i] || ""}
                        onChange={(e) => updateMedATC(i, e.target.value)}
                        placeholder="ATC"
                        className="uppercase"
                        maxLength={7}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* último Esquema */}
        {recibioQt === "1" && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <h4 className="font-semibold text-indigo-800 mb-4">último Esquema Quimioterapia</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Inicio (V51)</label>
                <Input
                  type="date"
                  value={report.terapia_sistemica?.ultimo_esquema?.fecha_inicio || ""}
                  onChange={(e) => updateUltimoEsquema("fecha_inicio", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Núm. Ciclos (V57)</label>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={report.terapia_sistemica?.ultimo_esquema?.num_ciclos || ""}
                  onChange={(e) => updateUltimoEsquema("num_ciclos", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha últilmo Ciclo (V58)</label>
                <Input
                  type="date"
                  value={report.terapia_sistemica?.ultimo_esquema?.fecha_ultimo_ciclo || ""}
                  onChange={(e) => updateUltimoEsquema("fecha_ultimo_ciclo", e.target.value)}
                />
              </div>
            </div>
            <div className="border rounded p-3 bg-white">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Medicamentos ATC - úlltimo Esquema (V54-V56)</h4>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-xs text-gray-500">V{54 + i}</label>
                    <Input
                      value={report.terapia_sistemica?.ultimo_esquema?.meds_atc?.[i] || ""}
                      onChange={(e) => updateUltimoATC(i, e.target.value)}
                      placeholder="ATC"
                      className="uppercase"
                      maxLength={7}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hormonoterapia */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-indigo-800 mb-4 text-lg">Hormonoterapia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recibió Hormonoterapia (V60)</label>
              <Select
                value={String(report.terapia_sistemica?.hormonoterapia?.recibio || "")}
                onValueChange={(v) => {
                  updateHormono("recibio", v);
                  if (v === "2") updateHormono("meds_atc", null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {report.terapia_sistemica?.hormonoterapia?.recibio === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Inicio (V61)</label>
                <Input
                  type="date"
                  value={report.terapia_sistemica?.hormonoterapia?.fecha_inicio || ""}
                  onChange={(e) => updateHormono("fecha_inicio", e.target.value)}
                />
              </div>
            )}
          </div>
          {report.terapia_sistemica?.hormonoterapia?.recibio === "1" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo Hormonoterapia (V62)</label>
                  <Select
                    value={String(report.terapia_sistemica?.hormonoterapia?.tipo || "")}
                    onValueChange={(v) => updateHormono("tipo", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Combinada</SelectItem>
                      <SelectItem value="2">2 - Sequencial</SelectItem>
                      <SelectItem value="98">98 - Se ignora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Estado (V67)</label>
                  <Select
                    value={String(report.terapia_sistemica?.hormonoterapia?.estado || "")}
                    onValueChange={(v) => updateHormono("estado", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Finalizado</SelectItem>
                      <SelectItem value="2">2 - En curso</SelectItem>
                      <SelectItem value="3">3 - No completado</SelectItem>
                      <SelectItem value="4">4 - Suspendido</SelectItem>
                      <SelectItem value="98">98 - Se ignora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border rounded p-3 bg-white">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Medicamentos ATC (V63-V65)</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-xs text-gray-500">V{63 + i}</label>
                      <Input
                        value={report.terapia_sistemica?.hormonoterapia?.meds_atc?.[i] || ""}
                        onChange={(e) => updateHormonoATC(i, e.target.value)}
                        placeholder="ATC"
                        className="uppercase"
                        maxLength={7}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Inmunoterapia */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-indigo-800 mb-4 text-lg">Inmunoterapia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recibió Inmunoterapia (V68)</label>
              <Select
                value={String(report.terapia_sistemica?.inmunoterapia?.recibio || "")}
                onValueChange={(v) => {
                  updateInmuno("recibio", v);
                  if (v === "2") updateInmuno("meds_atc", null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sí</SelectItem>
                  <SelectItem value="2">2 - No</SelectItem>
                  <SelectItem value="98">98 - Se ignora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {report.terapia_sistemica?.inmunoterapia?.recibio === "1" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha Inicio (V69)</label>
                <Input
                  type="date"
                  value={report.terapia_sistemica?.inmunoterapia?.fecha_inicio || ""}
                  onChange={(e) => updateInmuno("fecha_inicio", e.target.value)}
                />
              </div>
            )}
          </div>
          {report.terapia_sistemica?.inmunoterapia?.recibio === "1" && (
            <>
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-gray-700">Estado (V73)</label>
                <Select
                  value={String(report.terapia_sistemica?.inmunoterapia?.estado || "")}
                  onValueChange={(v) => updateInmuno("estado", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Finalizado</SelectItem>
                    <SelectItem value="2">2 - En curso</SelectItem>
                    <SelectItem value="3">3 - No completado</SelectItem>
                    <SelectItem value="4">4 - Suspendido</SelectItem>
                    <SelectItem value="98">98 - Se ignora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded p-3 bg-white">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Medicamentos ATC (V70-V71)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-xs text-gray-500">V{70 + i}</label>
                      <Input
                        value={report.terapia_sistemica?.inmunoterapia?.meds_atc?.[i] || ""}
                        onChange={(e) => updateInmunoATC(i, e.target.value)}
                        placeholder="ATC"
                        className="uppercase"
                        maxLength={7}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
