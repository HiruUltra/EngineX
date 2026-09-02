import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.header("x-request-id") || nanoid();
  res.setHeader("x-request-id", req.requestId);
  next();
}
