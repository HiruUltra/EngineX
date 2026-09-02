import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Vehicle } from "../models/Vehicle.js";
import { AppError, ok } from "../utils/http.js";
import { vehicleSchema } from "../validators/schemas.js";

export const vehicleRoutes = Router();
vehicleRoutes.use(requireAuth, requireRole("CUSTOMER", "ADMIN"));

vehicleRoutes.get("/", async (req, res) => {
  const query = req.user!.role === "ADMIN" ? {} : { customer: req.user!._id };
  ok(res, await Vehicle.find(query).sort("-createdAt"));
});

vehicleRoutes.post("/", async (req, res) => {
  const vehicle = await Vehicle.create({ ...vehicleSchema.parse(req.body), customer: req.user!._id });
  ok(res, vehicle, 201);
});

vehicleRoutes.patch("/:id", async (req, res) => {
  const query = req.user!.role === "ADMIN" ? { _id: req.params.id } : { _id: req.params.id, customer: req.user!._id };
  const vehicle = await Vehicle.findOneAndUpdate(query, vehicleSchema.partial().parse(req.body), { new: true });
  if (!vehicle) throw new AppError(404, "Vehicle not found");
  ok(res, vehicle);
});

vehicleRoutes.delete("/:id", async (req, res) => {
  const query = req.user!.role === "ADMIN" ? { _id: req.params.id } : { _id: req.params.id, customer: req.user!._id };
  const result = await Vehicle.deleteOne(query);
  if (!result.deletedCount) throw new AppError(404, "Vehicle not found");
  ok(res, { deleted: true });
});
