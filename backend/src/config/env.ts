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
  PAYMENT_PROVIDER: z.enum(["mock"]).default("mock"),
  // Google OAuth 2.0
  GOOGLE_CLIENT_ID: z.string().default(""),
  // Auth0 (legacy fallback)
  AUTH0_DOMAIN: z.string().default(""),
  AUTH0_AUDIENCE: z.string().default(""),
  AUTH0_CLIENT_ID: z.string().default(""),
  AUTH0_CLIENT_SECRET: z.string().default(""),
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),
  TWILIO_FROM_NUMBER: z.string().default(""),
  // SMTP / Email
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("EngineX <noreply@enginex.lk>"),
  // Mechanic registration
  MECHANIC_REGISTRATION_FEE: z.coerce.number().default(2500),
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default("")
});

export const env = envSchema.parse(process.env);
