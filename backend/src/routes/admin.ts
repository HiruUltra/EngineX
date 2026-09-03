import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { MechanicProfile } from "../models/Profiles.js";
import "../models/ServiceCenter.js";
import { ServiceRequest } from "../models/ServiceRequest.js";
import { User } from "../models/User.js";
import { ServiceCategory } from "../models/ServiceCategory.js";
import { AuditLog, Payment, Review } from "../models/WorkflowModels.js";
import { ok } from "../utils/http.js";

export const adminRoutes = Router();
adminRoutes.use(requireAuth);

adminRoutes.get("/analytics", requireRole("MANAGER", "ADMIN"), async (_req, res) => {
  const [requests, active, completed, users, revenue, reviews] = await Promise.all([
    ServiceRequest.countDocuments(),
    ServiceRequest.countDocuments({ currentStatus: { $in: ["SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "INSPECTING", "REPAIRING"] } }),
    ServiceRequest.countDocuments({ currentStatus: "COMPLETED" }),
    User.countDocuments(),
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Review.aggregate([{ $group: { _id: null, avg: { $avg: "$rating" } } }])
  ]);
  ok(res, {
    requests,
    active,
    completed,
    users,
    revenue: revenue[0]?.total || 0,
    satisfaction: Number((reviews[0]?.avg || 0).toFixed(1)),
    averageArrivalMinutes: 15,
    averageCompletionMinutes: 92
  });
});

adminRoutes.get("/users", requireRole("ADMIN"), async (_req, res) => ok(res, await User.find().sort("-createdAt")));
adminRoutes.patch("/users/:id", requireRole("ADMIN"), async (req, res) => {
  const input = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(7).optional(),
    role: z.enum(["CUSTOMER", "MECHANIC", "MANAGER", "ADMIN"]).optional(),
    avatarUrl: z.string().optional(),
    isActive: z.boolean().optional(),
    theme: z.enum(["dark", "light", "system"]).optional()
  }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, { $set: input }, { new: true });
  await AuditLog.create({ actor: req.user!._id, action: "user.update", entity: "User", entityId: req.params.id });
  ok(res, user);
});
adminRoutes.get("/audit-logs", requireRole("ADMIN"), async (_req, res) => ok(res, await AuditLog.find().sort("-createdAt").limit(100)));

adminRoutes.get("/mechanic-applications", requireRole("MANAGER", "ADMIN"), async (_req, res) => {
  const profiles = await MechanicProfile.find().populate("user serviceCenter").sort({ isVerified: 1, createdAt: -1 });
  ok(res, profiles);
});

adminRoutes.patch("/mechanic-applications/:id", requireRole("MANAGER", "ADMIN"), async (req, res) => {
  const input = z.object({
    isVerified: z.boolean(),
    isOnline: z.boolean().optional(),
    supportedVehicleTypes: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional()
  }).parse(req.body);
  const profile = await MechanicProfile.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        ...input,
        isOnline: input.isOnline ?? input.isVerified
      }
    },
    { new: true }
  ).populate("user serviceCenter");
  await AuditLog.create({ actor: req.user!._id, action: input.isVerified ? "mechanic.approve" : "mechanic.reject", entity: "MechanicProfile", entityId: req.params.id });
  ok(res, profile);
});

adminRoutes.post("/service-categories", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const category = await ServiceCategory.create(req.body);
  await AuditLog.create({ actor: req.user!._id, action: "service_category.create", entity: "ServiceCategory", entityId: String(category._id) });
  ok(res, category, 201);
});

adminRoutes.get("/service-categories", async (_req, res) => ok(res, await ServiceCategory.find({ isActive: true })));
