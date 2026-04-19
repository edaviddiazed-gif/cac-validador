import { useState, useEffect } from 'react';

export interface Opcion {
  value: string;
  label: string;
}

export interface Catalogos {
  tipo_id: Opcion[];
  sexo: Opcion[];
  regimen: Opcion[];
  pertenencia_etnica: Opcion[];
  tipo_estudio: Opcion[];
  motivo_sin_histo: Opcion[];
  histologia: Opcion[];
  grado_diferenciacion: Opcion[];
  her2_realizado: Opcion[];
  resultado_her2: Opcion[];
  dukes: Opcion[];
  ann_arbor: Opcion[];
  gleason: Opcion[];
  objetivo: Opcion[];
  objetivo_periodo: Opcion[];
  si_no: Opcion[];
  recibio_qt: Opcion[];
  ubicacion_esquema: Opcion[];
  caracteristicas_esq: Opcion[];
  motivo_fin_esq: Opcion[];
  recibio_cirugia: Opcion[];
  recibio_rt: Opcion[];
  recibio_trasplante: Opcion[];
  tipo_treatment_corte: Opcion[];
  resultado_oncologico: Opcion[];
  estado_vital: Opcion[];
  causa_muerte: Opcion[];
  novedad_administrativa: Opcion[];
  novedad_clinica: Opcion[];
  clasificacion_riesgo: Opcion[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useCatalogos() {
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalogos() {
      try {
        const response = await fetch(`${API_BASE}/catalogos`);
        if (!response.ok) {
          throw new Error('Error al cargar catálogos');
        }
        const data = await response.json();
        setCatalogos(data);
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
