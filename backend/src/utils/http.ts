import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ ok: false, error: { message: "Validation failed", details: err.flatten() } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ ok: false, error: { message: err.message } });
  }
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err instanceof Error ? err.message : "Unknown error";
  return res.status(500).json({ ok: false, error: { message } });
}
