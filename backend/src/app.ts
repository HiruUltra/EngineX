import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { mechanicRoutes } from "./routes/mechanic.js";
import { mapRoutes } from "./routes/map.js";
import { requestRoutes } from "./routes/requests.js";
import { uploadRoutes } from "./routes/uploads.js";
import { vehicleRoutes } from "./routes/vehicles.js";
import { errorHandler, ok } from "./utils/http.js";
import { requestId } from "./middleware/requestId.js";

const allowedOrigins = [env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean);

export function createApp() {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false
  }));
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(requestId);
  app.use("/uploads", express.static("uploads"));
  app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 120 }), authRoutes);
  app.use("/api/v1/vehicles", vehicleRoutes);
  app.use("/api/v1/requests", rateLimit({ windowMs: 60 * 1000, limit: 60 }), requestRoutes);
  app.use("/api/v1/uploads", uploadRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/mechanic", mechanicRoutes);
  app.use("/api/v1/map", mapRoutes);
  app.get("/api/v1/health", (_req, res) => ok(res, { status: "healthy", app: "EngineX" }));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup({
    openapi: "3.0.0",
    info: { title: "EngineX API", version: "1.0.0" },
    paths: { "/api/v1/health": { get: { responses: { 200: { description: "Healthy" } } } } }
  }));
  app.use(errorHandler);
  return app;
}
