import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { CustomerProfile, MechanicProfile } from "../models/Profiles.js";
import { RefreshToken } from "../models/WorkflowModels.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/http.js";
import { signAccessToken } from "../middleware/auth.js";
import type { Role } from "../models/types.js";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(input: { name: string; email: string; phone: string; password: string; role: Role }) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new AppError(409, "Email is already registered");
  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    passwordHash: await bcrypt.hash(input.password, 12)
  });
  if (user.role === "CUSTOMER") await CustomerProfile.create({ user: user._id, notificationPreferences: { sms: true, email: true, push: true } });
  if (user.role === "MECHANIC") await MechanicProfile.create({ user: user._id, skills: [], supportedVehicleTypes: [], isVerified: false, profileStatus: "payment_pending" });
  return createSession(user.id);
}

export async function loginWithGoogle(googleId: string, email: string, name: string, avatarUrl?: string, role: Role = "CUSTOMER") {
  let user = await User.findOne({ googleId });
  if (!user) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.googleId = googleId;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        phone: "N/A",
        role,
        googleId,
        avatarUrl,
        phoneVerified: false
      });
      if (role === "CUSTOMER") await CustomerProfile.create({ user: user._id, notificationPreferences: { sms: true, email: true, push: true } });
      if (role === "MECHANIC") await MechanicProfile.create({ user: user._id, skills: [], supportedVehicleTypes: [], isVerified: false, profileStatus: "payment_pending" });
    }
  }
  return createSession(user.id);
}

export async function loginWithAuth0(auth0Sub: string, email: string, name: string, phone = "N/A", role: Role = "CUSTOMER") {
  // Upsert user by auth0Sub
  let user = await User.findOne({ auth0Sub });
  if (!user) {
    // Try by email
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.auth0Sub = auth0Sub;
      await user.save();
    } else {
      user = await User.create({ name, email: email.toLowerCase(), phone, role, auth0Sub, phoneVerified: true });
      if (role === "CUSTOMER") await CustomerProfile.create({ user: user._id, notificationPreferences: { sms: true, email: true, push: true } });
      if (role === "MECHANIC") await MechanicProfile.create({ user: user._id, skills: [], supportedVehicleTypes: [], isVerified: false, profileStatus: "payment_pending" });
    }
  }
  return createSession(user.id);
}

export async function login(identifier: string, password: string) {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier.trim() }]
  }).select("+passwordHash");
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Invalid email, phone or password");
  return createSession(user.id);
}

export async function createSession(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");
  const refreshToken = crypto.randomBytes(48).toString("hex");
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  return { user: sanitizeUser(user), accessToken: signAccessToken(user), refreshToken };
}

export async function refresh(refreshToken: string) {
  const session = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken), revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
  if (!session) throw new AppError(401, "Invalid refresh token");
  session.revokedAt = new Date();
  await session.save();
  return createSession(String(session.user));
}

export function verifySocketToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: Role };
}

export function sanitizeUser(user: { id?: string; _id?: unknown; name: string; email: string; phone: string; role: Role; avatarUrl?: string; theme: string }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl, theme: user.theme };
}
