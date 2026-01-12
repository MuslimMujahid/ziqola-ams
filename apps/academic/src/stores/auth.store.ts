import type { AuthUser } from "@/lib/services/api/auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthTokens = {
  accessToken: string | null;
};

type AuthStore = AuthTokens & {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  setSession: (payload: { user: AuthUser; tokens: AuthTokens }) => void;
  clearSession: () => void;
};

const AUTH_STORAGE_KEY = "academic-auth";

const authStorage =
  typeof window !== "undefined"
    ? createJSONStorage<AuthStore>(() => window.localStorage)
    : undefined;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hydrated: false,
      setHydrated: (value) => {
        set({ hydrated: value });
      },
      setUser: (user) => {
        set({ user });
      },
      setTokens: (tokens) => {
        set({
          accessToken: tokens.accessToken,
          isAuthenticated: Boolean(tokens.accessToken),
        });
      },
      setSession: ({ user, tokens }) => {
        set({
          user,
          accessToken: tokens.accessToken,
          isAuthenticated: Boolean(tokens.accessToken),
        });
      },
      clearSession: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: authStorage,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.setHydrated(true);
        state.setTokens({
          accessToken: state.accessToken,
        });
      },
    },
  ),
);
