import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
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
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new AppError(401, "Authentication required");
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw new AppError(401, "Invalid session");
    req.user = user;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw new AppError(403, "Permission denied");
    next();
  };
}
