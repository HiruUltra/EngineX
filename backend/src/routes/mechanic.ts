import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { MechanicProfile } from "../models/Profiles.js";
import { ServiceRequest } from "../models/ServiceRequest.js";
import { User } from "../models/User.js";
import { RegistrationPayment } from "../models/WorkflowModels.js";
import { env } from "../config/env.js";
import { ok, AppError } from "../utils/http.js";

export const mechanicRoutes = Router();
mechanicRoutes.use(requireAuth);
mechanicRoutes.use(requireRole("MECHANIC", "ADMIN"));

// GET profile status
mechanicRoutes.get("/profile-status", async (req, res) => {
  const profile = await MechanicProfile.findOne({ user: req.user!._id }).populate("registrationPayment");
  ok(res, {
    profileStatus: profile?.profileStatus ?? "payment_pending",
    isVerified: profile?.isVerified ?? false,
    registrationPayment: profile?.registrationPayment ?? null
  });
});

// POST — initiate registration payment (mock paid immediately in dev)
mechanicRoutes.post("/registration-payment", async (req, res) => {
  const input = z.object({
    method: z.enum(["card", "online", "cash"]),
    // For real Stripe: paymentIntentId would come here
    cardLast4: z.string().length(4).optional(),
    cardBrand: z.string().optional()
  }).parse(req.body);

  const existing = await RegistrationPayment.findOne({ mechanic: req.user!._id, status: "paid" });
  if (existing) throw new AppError(409, "Registration fee already paid");

  const amount = env.MECHANIC_REGISTRATION_FEE;
  const receiptNumber = `REG-${Date.now()}`;

  // In development / mock mode: mark as paid immediately
  const payment = await RegistrationPayment.create({
    mechanic: req.user!._id,
    amount,
    currency: "LKR",
    method: input.method,
    status: "paid",
    receiptNumber,
    paidAt: new Date()
  });

  ok(res, { payment, amount, currency: "LKR", receiptNumber }, 201);
});

// POST — submit mechanic profile for verification (requires paid registration)
mechanicRoutes.post("/profile", async (req, res) => {
  const input = z.object({
    skills: z.array(z.string().min(1)).min(1),
    supportedVehicleTypes: z.array(z.enum(["motorcycle", "three-wheeler", "car", "van", "truck", "bus", "other"])).min(1),
    serviceCenterId: z.string().optional(),
    verificationDocs: z.array(z.string().url()).default([]),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional()
  }).parse(req.body);

  // Check registration payment
  const payment = await RegistrationPayment.findOne({ mechanic: req.user!._id, status: "paid" });
  if (!payment) throw new AppError(402, "Registration fee must be paid before submitting profile");

  const existing = await MechanicProfile.findOne({ user: req.user!._id });
  if (existing && existing.profileStatus !== "payment_pending") {
    throw new AppError(409, "Profile already submitted");
  }

  const profileData: Record<string, unknown> = {
    user: req.user!._id,
    skills: input.skills,
    supportedVehicleTypes: input.supportedVehicleTypes,
    verificationDocs: input.verificationDocs,
    profileStatus: "pending_verification",
    registrationPayment: payment._id,
    isVerified: false,
    isOnline: false
  };
  if (input.serviceCenterId) profileData.serviceCenter = input.serviceCenterId;
  if (input.latitude !== undefined && input.longitude !== undefined) {
    profileData.currentLocation = { type: "Point", coordinates: [input.longitude, input.latitude] };
  }

  let profile;
  if (existing) {
    profile = await MechanicProfile.findByIdAndUpdate(existing._id, { $set: profileData }, { new: true });
  } else {
    profile = await MechanicProfile.create(profileData);
  }

  ok(res, profile, 201);
});

// GET nearby active breakdowns (for mechanic map)
mechanicRoutes.get("/nearby-breakdowns", async (req, res) => {
  const lat = parseFloat(String(req.query.lat || "6.9271"));
  const lon = parseFloat(String(req.query.lon || "79.8612"));
  const breakdowns = await ServiceRequest.find({
    currentStatus: { $in: ["SEARCHING", "NO_MECHANIC_AVAILABLE"] },
    breakdownLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [lon, lat] },
        $maxDistance: 50000
      }
    }
  }).populate("vehicle customer").limit(20);
  ok(res, breakdowns);
});

// PATCH — update mechanic location
mechanicRoutes.patch("/location", async (req, res) => {
  const input = z.object({ latitude: z.number(), longitude: z.number() }).parse(req.body);
  const profile = await MechanicProfile.findOneAndUpdate(
    { user: req.user!._id },
    { $set: { currentLocation: { type: "Point", coordinates: [input.longitude, input.latitude] } } },
    { new: true }
  );
  if (!profile) throw new AppError(404, "Mechanic profile not found");
  ok(res, { updated: true });
});
