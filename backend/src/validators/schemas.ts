import { z } from "zod";
import { roles } from "../models/types.js";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
  role: z.enum(roles).default("CUSTOMER")
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(2),
  make: z.string().min(1),
  model: z.string().min(1),
  manufactureYear: z.number().int().min(1950).max(2035),
  vehicleType: z.enum(["motorcycle", "three-wheeler", "car", "van", "truck", "bus", "other"]),
  fuelType: z.enum(["petrol", "diesel", "hybrid", "electric", "other"]),
  transmission: z.enum(["manual", "automatic", "other"]),
  colour: z.string().min(2),
  vin: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional()
});

export const createRequestSchema = z.object({
  vehicle: z.string(),
  serviceType: z.enum(["inspection", "repair", "towing"]),
  problemCategory: z.string().min(2),
  description: z.string().min(5),
  urgency: z.enum(["low", "normal", "high", "emergency"]).default("normal"),
  address: z.string().min(3),
  longitude: z.number().min(79).max(82),
  latitude: z.number().min(5).max(10),
  images: z.array(z.string()).max(5).default([])
});

export const statusSchema = z.object({ status: z.string(), note: z.string().optional() });

export const quoteSchema = z.object({
  labourFee: z.number().min(0),
  partsCost: z.number().min(0),
  serviceFee: z.number().min(0),
  taxes: z.number().min(0),
  estimatedRepairMinutes: z.number().int().positive()
});
