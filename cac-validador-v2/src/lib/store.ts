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
}));
