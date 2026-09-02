import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/enginex"),
  JWT_ACCESS_SECRET: z.string().min(12).default("replace_with_secure_value"),
  JWT_REFRESH_SECRET: z.string().min(12).default("replace_with_secure_value"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  PAYMENT_PROVIDER: z.enum(["mock"]).default("mock")
});

export const env = envSchema.parse(process.env);
