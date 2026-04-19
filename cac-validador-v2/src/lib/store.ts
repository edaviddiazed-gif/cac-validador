import { create } from "zustand";

interface ValidationStats {
  totalRegistros: number;
  registrosValidos: number;
  registrosConError: number;
  porcentajeCalidad: number;
}

interface AppState {
  // Current EAPB context
  currentEapbId: string | null;
  setCurrentEapbId: (id: string | null) => void;

  // Validation stats
  stats: ValidationStats;
  setStats: (stats: ValidationStats) => void;

  // Upload progress
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;

  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Manual Report state
  report: any;
  setReport: (report: any) => void;
}

/**
 * Global application state store using Zustand.
 * For server state (API data), use TanStack Query instead.
 */
export const useAppStore = create<AppState>((set) => ({
  currentEapbId: null,
  setCurrentEapbId: (id) => set({ currentEapbId: id }),

  stats: {
    totalRegistros: 0,
    registrosValidos: 0,
    registrosConError: 0,
    porcentajeCalidad: 0,
  },
  setStats: (stats) => set({ stats }),

  uploadProgress: 0,
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  report: {
    cabecera: { fecha_corte: "", entidad_responsable: "" },
    paciente: {
      tipo_id: "CC",
      num_id: "",
      primer_apellido: "",
      segundo_apellido: "NOAP",
      primer_nombre: "",
      segundo_nombre: "NONE",
      fecha_nacimiento: "",
      sexo: "",
      regimen: "C",
      pertenencia_etnica: "6",
    },
    diagnostico: {
      cie10_neoplasia_primaria: "",
      fecha_diagnostico: "",
    },
    terapia_sistemica: { recibio_qt: "98" },
    cirugia: { recibio_cirugia: "2" },
    radioterapia: { recibio_rt: "98" },
    trasplante: { recibio_trasplante: "98" },
    cuidados_paliativos: { valorado: "2" },
    resultado: {
      estado_vital: "",
      novedad_administrativa: "0",
      fecha_bdua: "",
    },
    reglas_levantadas: [],
  },
  setReport: (report) => set({ report }),
}));
