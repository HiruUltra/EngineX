"use client";
import { create } from "zustand";
import type { User } from "@/types/api";

type AuthState = {
  user?: User;
  accessToken?: string;
  setSession: (user: User, accessToken: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  setSession: (user, accessToken) => set({ user, accessToken }),
  logout: () => set({ user: undefined, accessToken: undefined })
}));
