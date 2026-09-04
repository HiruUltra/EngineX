import axios from "axios";
import type { MechanicProfile, ServiceRequest, User, Vehicle } from "@/types/api";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true
});

// Auth store accessor — imported lazily to avoid SSR issues
function getAccessToken() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("enginex-session");
    if (!raw) return undefined;
    return JSON.parse(raw)?.state?.accessToken as string | undefined;
  } catch {
    return undefined;
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?._retry && error.config?.url !== "/auth/login") {
      error.config._retry = true;
      try {
        const refreshed = await api.post("/auth/refresh");
        const newToken = refreshed.data.data.accessToken;
        // Update zustand store via localStorage directly to avoid circular import
        const raw = localStorage.getItem("enginex-session");
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.state.accessToken = newToken;
          parsed.state.user = refreshed.data.data.user;
          localStorage.setItem("enginex-session", JSON.stringify(parsed));
        }
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const endpoints = {
  login: (email: string, password: string) => api.post<{ data: { user: User; accessToken: string } }>("/auth/login", { email, password }),
  googleLogin: (credential?: string, accessToken?: string, role = "CUSTOMER") =>
    api.post<{ data: { user: User; accessToken: string } }>("/auth/google", { credential, accessToken, role }),
  auth0Callback: (sub: string, accessToken: string, email?: string, name?: string, role?: string) =>
    api.post<{ data: { user: User; accessToken: string } }>("/auth/auth0/callback", { sub, accessToken, email, name, role: role || "CUSTOMER" }),
  register: (data: Record<string, unknown>) => api.post<{ data: { user: User; accessToken: string } }>("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<{ data: { user: User } }>("/auth/me"),
  updateMe: (data: Partial<User>) => api.patch<{ data: { user: User } }>("/auth/me", data),
  mechanicProfile: () => api.get<{ data: MechanicProfile | null }>("/auth/me/mechanic-profile"),
  vehicles: () => api.get<{ data: Vehicle[] }>("/vehicles"),
  createVehicle: (data: Partial<Vehicle>) => api.post<{ data: Vehicle }>("/vehicles", data),
  upload: (data: FormData) => api.post<{ data: { url: string } }>("/uploads", data, { headers: { "Content-Type": "multipart/form-data" } }),
  requests: () => api.get<{ data: { items: ServiceRequest[] } }>("/requests"),
  createRequest: (data: Record<string, unknown>) => api.post<{ data: ServiceRequest }>("/requests", data),
  status: (id: string, status: string) => api.patch<{ data: ServiceRequest }>(`/requests/${id}/status`, { status }),
  quote: (id: string, data: Record<string, number>) => api.post(`/requests/${id}/quotation`, data),
  approveQuote: (id: string) => api.post(`/requests/${id}/quotation/approve`),
  pay: (id: string, method: string) => api.post(`/requests/${id}/payment`, { method }),
  review: (id: string, rating: number, comment: string) => api.post(`/requests/${id}/review`, { rating, comment }),
  analytics: () => api.get("/admin/analytics"),
  users: () => api.get<{ data: User[] }>("/admin/users"),
  updateUser: (id: string, data: Partial<User>) => api.patch<{ data: User }>(`/admin/users/${id}`, data),
  mechanicApplications: () => api.get<{ data: MechanicProfile[] }>("/admin/mechanic-applications"),
  updateMechanicApplication: (id: string, data: Partial<MechanicProfile> & { rejectionReason?: string }) =>
    api.patch<{ data: MechanicProfile }>(`/admin/mechanic-applications/${id}`, data),
  // Mechanic registration
  mechanicProfileStatus: () => api.get<{ data: { profileStatus: string; isVerified: boolean; registrationPayment: Record<string, unknown> | null } }>("/mechanic/profile-status"),
  mechanicRegistrationPayment: (method: string) => api.post<{ data: { payment: Record<string, unknown>; amount: number; receiptNumber: string } }>("/mechanic/registration-payment", { method }),
  submitMechanicProfile: (data: Record<string, unknown>) => api.post<{ data: MechanicProfile }>("/mechanic/profile", data),
  mechanicUpdateLocation: (latitude: number, longitude: number) => api.patch("/mechanic/location", { latitude, longitude }),
  nearbyBreakdowns: (lat: number, lon: number) => api.get(`/mechanic/nearby-breakdowns?lat=${lat}&lon=${lon}`),
  // Map
  mapMechanics: () => api.get("/map/mechanics"),
  mapBreakdowns: () => api.get("/map/breakdowns")
};
