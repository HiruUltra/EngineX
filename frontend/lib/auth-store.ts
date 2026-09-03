"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api";

type AuthState = {
  user?: User;
  accessToken?: string;
  setSession: (user: User, accessToken: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setSession: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: undefined, accessToken: undefined })
    }),
    { name: "enginex-session" }
  )
);
