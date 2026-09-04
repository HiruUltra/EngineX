import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { MechanicProfile } from "../models/Profiles.js";
import { ServiceRequest } from "../models/ServiceRequest.js";
import { ok } from "../utils/http.js";

export const mapRoutes = Router();
mapRoutes.use(requireAuth);

// Live online verified mechanics with locations (for manager/admin map)
mapRoutes.get("/mechanics", async (_req, res) => {
  const mechanics = await MechanicProfile.find({
    isVerified: true,
    isOnline: true,
    profileStatus: "approved",
    currentLocation: { $exists: true }
  }).populate("user", "name phone avatarUrl");
  ok(res, mechanics.map((m) => {
    const u = m.user as unknown as { name: string; phone: string; avatarUrl?: string };
    return {
      _id: m._id,
      name: u.name,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      rating: m.rating,
      coordinates: m.currentLocation?.coordinates,
      hasActiveJob: Boolean(m.activeRequest)
    };
  }));
});

// Active breakdown locations (for mechanic / manager map)
mapRoutes.get("/breakdowns", async (_req, res) => {
  const active = await ServiceRequest.find({
    currentStatus: { $in: ["SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "INSPECTING", "REPAIRING"] }
  }).populate("vehicle customer", "name phone registrationNumber make model");
  ok(res, active.map((r) => ({
    _id: r._id,
    status: r.currentStatus,
    problemCategory: r.problemCategory,
    address: r.address,
    coordinates: r.breakdownLocation.coordinates,
    vehicle: r.vehicle,
    urgency: r.urgency
  })));
});
