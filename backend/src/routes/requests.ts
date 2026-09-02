import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ServiceRequest } from "../models/ServiceRequest.js";
import { requestStatuses, type RequestStatus } from "../models/types.js";
import { MechanicLocation, Message } from "../models/WorkflowModels.js";
import { approveQuotation, changeStatus, createAssistanceRequest, createInspection, createMockPayment, createQuotation, createReview } from "../services/requestService.js";
import { AppError, ok } from "../utils/http.js";
import { createRequestSchema, quoteSchema, statusSchema } from "../validators/schemas.js";

export const requestRoutes = Router();
requestRoutes.use(requireAuth);

requestRoutes.get("/", async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const query: Record<string, unknown> = {};
  if (status) query.currentStatus = status;
  if (req.user!.role === "CUSTOMER") query.customer = req.user!._id;
  if (req.user!.role === "MECHANIC") query.assignedMechanic = req.user!._id;
  const [items, total] = await Promise.all([
    ServiceRequest.find(query).populate("vehicle assignedMechanic quotation payment review").sort("-createdAt").skip((page - 1) * limit).limit(limit),
    ServiceRequest.countDocuments(query)
  ]);
  ok(res, { items, page, limit, total });
});

requestRoutes.post("/", requireRole("CUSTOMER"), async (req, res) => {
  const request = await createAssistanceRequest(req.user!.id, createRequestSchema.parse(req.body));
  req.app.get("io")?.to(`user:${req.user!.id}`).emit("request:created", request);
  req.app.get("io")?.to(`request:${request!.id}`).emit("request:assigned", request);
  ok(res, request, 201);
});

requestRoutes.get("/:id", async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id).populate("vehicle assignedMechanic quotation payment review inspection");
  if (!request) throw new AppError(404, "Request not found");
  ok(res, request);
});

requestRoutes.patch("/:id/status", async (req, res) => {
  const input = statusSchema.extend({ status: z.enum(requestStatuses) }).parse(req.body);
  const id = String(req.params.id);
  const request = await changeStatus(id, req.user!.id, input.status as RequestStatus, input.note);
  req.app.get("io")?.to(`request:${id}`).emit("request:status-changed", request);
  ok(res, request);
});

requestRoutes.post("/:id/inspection", requireRole("MECHANIC", "ADMIN"), async (req, res) => {
  const inspection = await createInspection(String(req.params.id), req.user!.id, String(req.body.notes || ""));
  ok(res, inspection, 201);
});

requestRoutes.post("/:id/quotation", requireRole("MECHANIC", "ADMIN"), async (req, res) => {
  const id = String(req.params.id);
  const quote = await createQuotation(id, req.user!.id, quoteSchema.parse(req.body));
  req.app.get("io")?.to(`request:${id}`).emit("quote:created", quote);
  ok(res, quote, 201);
});

requestRoutes.post("/:id/quotation/approve", requireRole("CUSTOMER"), async (req, res) => {
  const id = String(req.params.id);
  const request = await approveQuotation(id, req.user!.id);
  req.app.get("io")?.to(`request:${id}`).emit("quote:approved", request);
  ok(res, request);
});

requestRoutes.post("/:id/payment", requireRole("CUSTOMER"), async (req, res) => {
  const input = z.object({ method: z.enum(["cash", "card", "online"]) }).parse(req.body);
  const id = String(req.params.id);
  const payment = await createMockPayment(id, req.user!.id, input.method);
  req.app.get("io")?.to(`request:${id}`).emit("payment:updated", payment);
  ok(res, payment, 201);
});

requestRoutes.post("/:id/review", requireRole("CUSTOMER"), async (req, res) => {
  const input = z.object({ rating: z.number().min(1).max(5), comment: z.string().optional() }).parse(req.body);
  ok(res, await createReview(String(req.params.id), req.user!.id, input.rating, input.comment), 201);
});

requestRoutes.post("/:id/messages", async (req, res) => {
  const message = await Message.create({ request: req.params.id, sender: req.user!._id, body: String(req.body.body || "") });
  req.app.get("io")?.to(`request:${req.params.id}`).emit("message:created", message);
  ok(res, message, 201);
});

requestRoutes.get("/:id/messages", async (req, res) => ok(res, await Message.find({ request: req.params.id }).sort("createdAt")));

requestRoutes.post("/:id/location", requireRole("MECHANIC"), async (req, res) => {
  const input = z.object({ longitude: z.number(), latitude: z.number(), heading: z.number().optional(), speedKph: z.number().optional() }).parse(req.body);
  const location = await MechanicLocation.create({
    mechanic: req.user!._id,
    request: req.params.id,
    location: { type: "Point", coordinates: [input.longitude, input.latitude] },
    heading: input.heading,
    speedKph: input.speedKph
  });
  req.app.get("io")?.to(`request:${req.params.id}`).emit("mechanic:location-updated", location);
  ok(res, location, 201);
});
