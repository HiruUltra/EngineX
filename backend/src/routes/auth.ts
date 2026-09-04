import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { MechanicProfile } from "../models/Profiles.js";
import "../models/ServiceCenter.js";
import { User } from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import { login, loginWithAuth0, loginWithGoogle, refresh, register, sanitizeUser } from "../services/authService.js";
import { AppError, ok } from "../utils/http.js";
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
authRoutes.patch("/me", requireAuth, async (req, res) => {
  const input = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(7).optional(),
    avatarUrl: z.string().optional(),
    theme: z.enum(["dark", "light", "system"]).optional()
  }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.user!._id, { $set: input }, { new: true });
  ok(res, { user: sanitizeUser(user!) });
});
authRoutes.get("/me/mechanic-profile", requireAuth, async (req, res) => {
  const profile = req.user!.role === "MECHANIC" ? await MechanicProfile.findOne({ user: req.user!._id }).populate("serviceCenter") : null;
  ok(res, profile);
});
authRoutes.post("/forgot-password", (_req, res) => ok(res, { message: "If an account exists, reset instructions will be sent." }));
authRoutes.post("/reset-password", (_req, res) => ok(res, { message: "Password reset placeholder accepted for configured mail providers." }));

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);

// Google OAuth 2.0 Sign-In / Login
authRoutes.post("/google", async (req, res) => {
  const input = z.object({
    credential: z.string().optional(),
    accessToken: z.string().optional(),
    role: z.enum(["CUSTOMER", "MECHANIC"]).default("CUSTOMER")
  }).parse(req.body);

  if (!input.credential && !input.accessToken) {
    throw new AppError(400, "Google credential (ID token) or accessToken is required");
  }

  let profile: { sub: string; email: string; name: string; picture?: string } | null = null;

  if (input.credential) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: input.credential,
        audience: env.GOOGLE_CLIENT_ID || undefined
      });
      const payload = ticket.getPayload();
      if (payload && payload.sub && payload.email) {
        profile = {
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.email.split("@")[0],
          picture: payload.picture
        };
      }
    } catch {
      // Fallback: verify via Google tokeninfo endpoint
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.credential)}`);
      if (resp.ok) {
        const data = await resp.json() as { sub: string; email: string; name?: string; picture?: string };
        if (data.sub && data.email) {
          profile = {
            sub: data.sub,
            email: data.email,
            name: data.name || data.email.split("@")[0],
            picture: data.picture
          };
        }
      }
    }
  } else if (input.accessToken) {
    const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${input.accessToken}` }
    });
    if (resp.ok) {
      const data = await resp.json() as { sub: string; email: string; name?: string; picture?: string };
      if (data.sub && data.email) {
        profile = {
          sub: data.sub,
          email: data.email,
          name: data.name || data.email.split("@")[0],
          picture: data.picture
        };
      }
    }
  }

  if (!profile) {
    throw new AppError(401, "Google authentication failed or token is invalid");
  }

  const session = await loginWithGoogle(
    profile.sub,
    profile.email,
    profile.name,
    profile.picture,
    input.role
  );
  setRefreshCookie(res, session.refreshToken);
  ok(res, { user: session.user, accessToken: session.accessToken });
});

// Auth0 SSO callback — legacy compatibility
authRoutes.post("/auth0/callback", async (req, res) => {
  const input = z.object({
    accessToken: z.string().optional().default(""),
    email: z.string().email().optional().or(z.literal("")),
    name: z.string().optional(),
    phone: z.string().optional(),
    sub: z.string(),
    role: z.enum(["CUSTOMER", "MECHANIC"]).default("CUSTOMER")
  }).parse(req.body);
  const cleanSub = input.sub.replace(/[^a-zA-Z0-9_-]/g, "_");
  const email = input.email && input.email.trim().length > 0
    ? input.email.trim()
    : `${cleanSub}@phone.enginex.lk`;
  const phone = input.phone || (input.sub.startsWith("sms|") ? input.sub.replace(/^sms\|/, "") : "N/A");
  const session = await loginWithAuth0(
    input.sub,
    email,
    input.name || phone || "Auth0 User",
    phone,
    input.role
  );
  setRefreshCookie(res, session.refreshToken);
  ok(res, { user: session.user, accessToken: session.accessToken });
});

