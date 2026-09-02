import { Router } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { login, refresh, register, sanitizeUser } from "../services/authService.js";
import { ok } from "../utils/http.js";
import { loginSchema, registerSchema } from "../validators/schemas.js";

export const authRoutes = Router();

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    path: "/api/v1/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

authRoutes.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);
  const session = await register({ ...input, role: input.role });
  setRefreshCookie(res, session.refreshToken);
  ok(res, { user: session.user, accessToken: session.accessToken }, 201);
});

authRoutes.post("/login", async (req, res) => {
  const input = loginSchema.parse(req.body);
  const session = await login(input.email, input.password);
  setRefreshCookie(res, session.refreshToken);
  ok(res, { user: session.user, accessToken: session.accessToken });
});

authRoutes.post("/refresh", async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const session = await refresh(token);
  setRefreshCookie(res, session.refreshToken);
  ok(res, { user: session.user, accessToken: session.accessToken });
});

authRoutes.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
  ok(res, { message: "Logged out" });
});

authRoutes.get("/me", requireAuth, (req, res) => ok(res, { user: sanitizeUser(req.user!) }));
authRoutes.post("/forgot-password", (_req, res) => ok(res, { message: "If an account exists, reset instructions will be sent." }));
authRoutes.post("/reset-password", (_req, res) => ok(res, { message: "Password reset placeholder accepted for configured mail providers." }));
