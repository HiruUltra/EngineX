import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
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
adminRoutes.get("/audit-logs", requireRole("ADMIN"), async (_req, res) => ok(res, await AuditLog.find().sort("-createdAt").limit(100)));

adminRoutes.post("/service-categories", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const category = await ServiceCategory.create(req.body);
  await AuditLog.create({ actor: req.user!._id, action: "service_category.create", entity: "ServiceCategory", entityId: String(category._id) });
  ok(res, category, 201);
});

adminRoutes.get("/service-categories", async (_req, res) => ok(res, await ServiceCategory.find({ isActive: true })));
