import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WorkspaceState = {
  academicYearId: string | null;
  academicPeriodId: string | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setAcademicYearId: (value: string | null) => void;
  setAcademicPeriodId: (value: string | null) => void;
  resetWorkspace: () => void;
};

const WORKSPACE_STORAGE_KEY = "academic-workspace";

const workspaceStorage =
  typeof window !== "undefined"
    ? createJSONStorage<WorkspaceState>(() => window.localStorage)
    : undefined;

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      academicYearId: null,
      academicPeriodId: null,
      hydrated: false,
      setHydrated: (value) => {
        set({ hydrated: value });
      },
      setAcademicYearId: (value) => {
        set((state) => ({
          academicYearId: value,
          academicPeriodId:
            value && state.academicYearId === value
              ? state.academicPeriodId
              : null,
        }));
      },
      setAcademicPeriodId: (value) => {
        set({ academicPeriodId: value });
      },
      resetWorkspace: () => {
        set({ academicYearId: null, academicPeriodId: null });
      },
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      storage: workspaceStorage,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.setHydrated(true);
      },
    },
  ),
);
