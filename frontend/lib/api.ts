"use client";
import axios from "axios";
import type { ServiceRequest, User, Vehicle } from "@/types/api";
import { useAuthStore } from "@/lib/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?._retry) {
      error.config._retry = true;
      const refreshed = await api.post("/auth/refresh");
      useAuthStore.getState().setSession(refreshed.data.data.user, refreshed.data.data.accessToken);
      error.config.headers.Authorization = `Bearer ${refreshed.data.data.accessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);

export const endpoints = {
  login: (email: string, password: string) => api.post<{ data: { user: User; accessToken: string } }>("/auth/login", { email, password }),
  register: (data: Record<string, unknown>) => api.post<{ data: { user: User; accessToken: string } }>("/auth/register", data),
  me: () => api.get<{ data: { user: User } }>("/auth/me"),
  vehicles: () => api.get<{ data: Vehicle[] }>("/vehicles"),
  createVehicle: (data: Partial<Vehicle>) => api.post<{ data: Vehicle }>("/vehicles", data),
  requests: () => api.get<{ data: { items: ServiceRequest[] } }>("/requests"),
  createRequest: (data: Record<string, unknown>) => api.post<{ data: ServiceRequest }>("/requests", data),
  status: (id: string, status: string) => api.patch<{ data: ServiceRequest }>(`/requests/${id}/status`, { status }),
  quote: (id: string, data: Record<string, number>) => api.post(`/requests/${id}/quotation`, data),
  approveQuote: (id: string) => api.post(`/requests/${id}/quotation/approve`),
  pay: (id: string, method: string) => api.post(`/requests/${id}/payment`, { method }),
  review: (id: string, rating: number, comment: string) => api.post(`/requests/${id}/review`, { rating, comment }),
  analytics: () => api.get("/admin/analytics")
};
