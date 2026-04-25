import { useState, useEffect } from 'react';

export interface Opcion {
  value: string;
  label: string;
}

export interface Catalogos {
  // Identificación (V01-V16)
  tipo_id: Opcion[];
  sexo: Opcion[];
  regimen: Opcion[];
  pertenencia_etnica: Opcion[];
  grupo_poblacional: Opcion[];

  // Diagnóstico (V17-V44)
  medio_diagnostico: Opcion[];
  base_diagnostico: Opcion[];
  grado_diferenciacion: Opcion[];
  lateralidad: Opcion[];
  histologia: Opcion[];
  comportamiento: Opcion[];
  estadificacion: Opcion[];
  clasificacion_tnm: Opcion[];
  her2_realizado: Opcion[];
  her2_resultado: Opcion[];
  receptores_hormonales: Opcion[];
  estadio_ann_arbor: Opcion[];
  sintomas_b: Opcion[];
  ipss: Opcion[];
  compromiso_extranodal: Opcion[];
  ldh: Opcion[];

  // Terapia Sistémica (V45-V73)
  recibio_tratamiento: Opcion[];
  intencion_tratamiento: Opcion[];
  estado_esquema: Opcion[];
  tipo_hormonoterapia: Opcion[];
  estado_hormonoterapia: Opcion[];
  estado_inmunoterapia: Opcion[];

  // Cirugía (V74-V85)
  intencion_cirugia: Opcion[];
  estado_post_cirugia: Opcion[];
  margen_quirurgico: Opcion[];

  // Radioterapia (V86-V105)
  tipo_radioterapia: Opcion[];
  estado_radioterapia: Opcion[];
  tipo_braquiterapia: Opcion[];

  // Trasplante (V106-V110)
  tipo_trasplante: Opcion[];
  estado_trasplante: Opcion[];

  // Tratamiento Complementario (V111-V124)
  recibio_complementario: Opcion[];

  // Situación Actual (V125-V134)
  estado_vital: Opcion[];
  causa_muerte: Opcion[];
  novedad_administrativa: Opcion[];
  novedad_clinica: Opcion[];
  ecocg: Opcion[];

  // Comunes
  si_no: Opcion[];
  motivo_no_tratamiento: Opcion[];
}

const CATALOGOS_TIPOS = [
  'tipo_id', 'sexo', 'regimen', 'pertenencia_etnica', 'grupo_poblacional',
  'medio_diagnostico', 'base_diagnostico', 'grado_diferenciacion', 'lateralidad',
  'histologia', 'comportamiento', 'estadificacion', 'clasificacion_tnm',
  'her2_realizado', 'her2_resultado', 'receptores_hormonales', 'estadio_ann_arbor',
  'sintomas_b', 'ipss', 'compromiso_extranodal', 'ldh', 'recibio_tratamiento',
  'intencion_tratamiento', 'estado_esquema', 'tipo_hormonoterapia', 'estado_hormonoterapia',
  'estado_inmunoterapia', 'intencion_cirugia', 'estado_post_cirugia', 'margen_quirurgico',
  'tipo_radioterapia', 'estado_radioterapia', 'tipo_braquiterapia', 'tipo_trasplante',
  'estado_trasplante', 'recibio_complementario', 'estado_vital', 'causa_muerte',
  'novedad_administrativa', 'novedad_clinica', 'ecocg', 'si_no'
] as const;

export function useCatalogos() {
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalogos() {
      try {
        const catalogosData: Partial<Catalogos> = {};

        // Cargar todos los catálogos en paralelo
        const responses = await Promise.all(
          CATALOGOS_TIPOS.map(async (tipo) => {
            try {
              const response = await fetch(`/api/catalogos/${tipo}`, {
                cache: 'force-cache',
              });
              if (!response.ok) throw new Error(`Error loading ${tipo}`);
              const data = await response.json();
              return { tipo, data: data.opciones || [] };
            } catch (err) {
              console.warn(`Failed to load catalog ${tipo}, using defaults`);
              return { tipo, data: getDefaultOptions(tipo) };
            }
          })
        );

        // Construir el objeto de catálogos
        responses.forEach(({ tipo, data }) => {
          (catalogosData as any)[tipo] = data;
        });

        setCatalogos(catalogosData as Catalogos);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCatalogos();
  }, []);

  return { catalogos, loading, error };
}

// Opciones por defecto como fallback
function getDefaultOptions(tipo: string): Opcion[] {
  const defaults: Record<string, Opcion[]> = {
    tipo_id: [
      { value: 'RC', label: 'RC - Registro Civil' },
      { value: 'TI', label: 'TI - Tarjeta Identidad' },
      { value: 'CC', label: 'CC - Cédula Ciudadanía' },
      { value: 'CE', label: 'CE - Cédula Extranjería' },
      { value: 'PA', label: 'PA - Pasaporte' },
      { value: 'MS', label: 'MS - Menor sin identificación' },
      { value: 'AS', label: 'AS - Adulto sin identificación' },
    ],
    sexo: [
      { value: 'M', label: 'M - Masculino' },
      { value: 'F', label: 'F - Femenino' },
      { value: 'I', label: 'I - Indeterminado' },
    ],
    regimen: [
      { value: 'C', label: 'C - Contributivo' },
      { value: 'S', label: 'S - Subsidiado' },
      { value: 'P', label: 'P - Prepagada' },
      { value: 'E', label: 'E - Excepción' },
      { value: 'N', label: 'N - No asegurado' },
    ],
    recibio_tratamiento: [
      { value: '1', label: '1 - Sí recibió' },
      { value: '2', label: '2 - No recibió' },
      { value: '98', label: '98 - Se ignora' },
    ],
    estado_vital: [
      { value: '1', label: '1 - Vivo' },
      { value: '2', label: '2 - Muerto por cáncer' },
      { value: '3', label: '3 - Muerto por otra causa' },
    ],
    si_no: [
      { value: '1', label: '1 - Sí' },
      { value: '2', label: '2 - No' },
      { value: '98', label: '98 - Se ignora' },
    ],
  };

  return defaults[tipo] || [];
}
