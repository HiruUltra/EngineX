import dotenv from "dotenv";
dotenv.config();

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { env } from "../config/env.js";
import { User, type UserDoc } from "../models/User.js";
import type { Role } from "../models/types.js";
import { AppError } from "../utils/http.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDoc;
      requestId?: string;
    }
  }
}

export function signAccessToken(user: UserDoc) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

let jwksClient: jwksRsa.JwksClient | null = null;

function getJwksClient() {
  if (!jwksClient && env.AUTH0_DOMAIN) {
    jwksClient = jwksRsa({
      jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true
    });
  }
  return jwksClient;
}

async function verifyAuth0Token(token: string): Promise<{ sub: string; email?: string; name?: string } | null> {
  const client = getJwksClient();
  if (!client || !env.AUTH0_DOMAIN) return null;
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded.header.kid !== "string") return null;
    const key = await client.getSigningKey(decoded.header.kid);
    const pubKey = key.getPublicKey();
    return jwt.verify(token, pubKey, {
      audience: env.AUTH0_AUDIENCE || undefined,
      issuer: `https://${env.AUTH0_DOMAIN}/`
    }) as { sub: string; email?: string; name?: string };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next(new AppError(401, "Authentication required"));
  try {
    // Try local JWT first
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return next(new AppError(401, "Invalid session"));
    req.user = user;
    return next();
  } catch {
    // Try Auth0 JWT
    const auth0Payload = await verifyAuth0Token(token);
    if (auth0Payload) {
      const user = await User.findOne({ auth0Sub: auth0Payload.sub });
      if (!user || !user.isActive) return next(new AppError(401, "Auth0 user not found — complete registration first"));
      req.user = user;
      return next();
    }
    return next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, "Permission denied"));
    next();
  };
}
