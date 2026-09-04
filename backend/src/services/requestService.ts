import { Types } from "mongoose";
import { MechanicProfile } from "../models/Profiles.js";
import { ServiceRequest } from "../models/ServiceRequest.js";
import { Vehicle } from "../models/Vehicle.js";
import { Inspection, Payment, Quotation, Review } from "../models/WorkflowModels.js";
import type { RequestStatus } from "../models/types.js";
import { AppError } from "../utils/http.js";
import { haversineKm } from "../utils/geo.js";
import { notifyNearbyMechanics } from "./notificationService.js";

const transitions: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ["SEARCHING", "CANCELLED_BY_CUSTOMER"],
  SEARCHING: ["ASSIGNED", "NO_MECHANIC_AVAILABLE", "CANCELLED_BY_CUSTOMER"],
  ASSIGNED: ["ACCEPTED", "CANCELLED_BY_MANAGER", "CANCELLED_BY_MECHANIC"],
  ACCEPTED: ["EN_ROUTE", "CANCELLED_BY_MECHANIC"],
  EN_ROUTE: ["ARRIVED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_MECHANIC"],
  ARRIVED: ["INSPECTING"],
  INSPECTING: ["QUOTE_SENT"],
  QUOTE_SENT: ["QUOTE_APPROVED", "QUOTE_REJECTED"],
  QUOTE_APPROVED: ["REPAIRING", "PAYMENT_PENDING"],
  REPAIRING: ["PAYMENT_PENDING", "COMPLETED"],
  PAYMENT_PENDING: ["COMPLETED", "PAYMENT_FAILED"],
  PAYMENT_FAILED: ["PAYMENT_PENDING", "DISPUTED"],
  QUOTE_REJECTED: ["CANCELLED_BY_CUSTOMER", "DISPUTED"],
  CANCELLED_BY_CUSTOMER: [],
  CANCELLED_BY_MECHANIC: [],
  CANCELLED_BY_MANAGER: [],
  NO_MECHANIC_AVAILABLE: ["SEARCHING", "CANCELLED_BY_CUSTOMER"],
  DISPUTED: [],
  COMPLETED: []
};

export async function createAssistanceRequest(customerId: string, input: {
  vehicle: string; serviceType: string; problemCategory: string; description: string; urgency: string;
  address: string; longitude: number; latitude: number; images: string[];
}) {
  const vehicle = await Vehicle.findOne({ _id: input.vehicle, customer: customerId });
  if (!vehicle) throw new AppError(404, "Vehicle not found");
  const request = await ServiceRequest.create({
    customer: customerId,
    vehicle: input.vehicle,
    serviceType: input.serviceType,
    problemCategory: input.problemCategory,
    description: input.description,
    urgency: input.urgency,
    images: input.images,
    address: input.address,
    breakdownLocation: { type: "Point", coordinates: [input.longitude, input.latitude] },
    currentStatus: "SEARCHING",
    statusHistory: [{ status: "SEARCHING", changedBy: customerId, note: "Customer requested assistance" }]
  });
  await assignNearbyMechanic(String(request._id));
  return ServiceRequest.findById(request._id).populate("vehicle assignedMechanic");
}

export async function assignNearbyMechanic(requestId: string) {
  const request = await ServiceRequest.findById(requestId).populate("vehicle customer");
  if (!request) throw new AppError(404, "Request not found");
  const vehicleType = (request.vehicle as unknown as { vehicleType: string }).vehicleType;
  const customer = request.customer as unknown as { name: string; phone: string };
  const [longitude, latitude] = request.breakdownLocation.coordinates;

  let candidates = await MechanicProfile.find({
    isVerified: true,
    isOnline: true,
    profileStatus: "approved",
    activeRequest: { $exists: false },
    supportedVehicleTypes: vehicleType,
    currentLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
        $maxDistance: 50000
      }
    }
  }).populate("user").limit(8);

  // Fallback: if no mechanic within 50km (e.g. testing from overseas coordinates), assign closest available verified mechanic
  if (!candidates.length) {
    candidates = await MechanicProfile.find({
      isVerified: true,
      isOnline: true,
      profileStatus: "approved",
      activeRequest: { $exists: false },
      supportedVehicleTypes: vehicleType
    }).populate("user").limit(8);
  }

  // Notify ALL nearby candidates (SMS + call + email)
  if (candidates.length > 0) {
    const targets = candidates.map((c) => {
      const u = c.user as unknown as { name: string; phone: string; email: string };
      return { name: u.name, phone: u.phone, email: u.email };
    });
    notifyNearbyMechanics(targets, {
      requestId,
      customerName: customer?.name || "Customer",
      customerPhone: customer?.phone || "N/A",
      problemCategory: request.problemCategory,
      address: request.address,
      latitude,
      longitude
    }).catch((err) => console.error("[notify] Failed:", err));
  }

  if (!candidates.length) {
    request.currentStatus = "NO_MECHANIC_AVAILABLE";
    request.statusHistory.push({ status: "NO_MECHANIC_AVAILABLE", note: "No verified online mechanic nearby" });
    await request.save();
    return null;
  }

  const best = candidates
    .map((profile, index) => ({ profile, score: profile.rating * 10 - profile.workload * 3 - index }))
    .sort((a, b) => b.score - a.score)[0];

  const mechanicLoc = best.profile.currentLocation?.coordinates;
  const distanceKm = mechanicLoc
    ? haversineKm(mechanicLoc[0], mechanicLoc[1], longitude, latitude)
    : 5.0;
  const estimatedArrivalMinutes = Math.round((distanceKm / 30) * 60); // ~30 km/h city speed

  best.profile.set("activeRequest", request._id);
  await best.profile.save();
  request.set("assignedMechanic", best.profile.user);
  request.currentStatus = "ASSIGNED";
  request.estimatedDistanceKm = Math.round(distanceKm * 10) / 10;
  request.estimatedArrivalMinutes = estimatedArrivalMinutes;
  request.assignmentAttempts.push({ mechanic: best.profile.user as Types.ObjectId, score: best.score, at: new Date() });
  request.statusHistory.push({ status: "ASSIGNED", changedBy: best.profile.user as Types.ObjectId, note: "Automatic nearby assignment" });
  await request.save();
  return best.profile;
}

export async function changeStatus(requestId: string, userId: string, nextStatus: RequestStatus, note?: string) {
  const request = await ServiceRequest.findById(requestId);
  if (!request) throw new AppError(404, "Request not found");
  const current = request.currentStatus as RequestStatus;
  if (!transitions[current].includes(nextStatus)) throw new AppError(409, `Invalid status transition from ${current} to ${nextStatus}`);
  request.currentStatus = nextStatus;
  request.statusHistory.push({ status: nextStatus, changedBy: userId, note });
  await request.save();
  if (nextStatus === "COMPLETED" && request.assignedMechanic) {
    await MechanicProfile.updateOne({ user: request.assignedMechanic }, { $unset: { activeRequest: "" } });
  }
  return request;
}

export async function createQuotation(requestId: string, mechanicId: string, input: { labourFee: number; partsCost: number; serviceFee: number; taxes: number; estimatedRepairMinutes: number }) {
  const total = input.labourFee + input.partsCost + input.serviceFee + input.taxes;
  const quote = await Quotation.create({ request: requestId, mechanic: mechanicId, ...input, total, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  await ServiceRequest.findByIdAndUpdate(requestId, { quotation: quote._id });
  await changeStatus(requestId, mechanicId, "QUOTE_SENT", "Quotation sent to customer");
  return quote;
}

export async function approveQuotation(requestId: string, customerId: string) {
  const request = await ServiceRequest.findOne({ _id: requestId, customer: customerId }).populate("quotation");
  if (!request || !request.quotation) throw new AppError(404, "Quotation not found");
  await Quotation.updateOne({ _id: request.quotation }, { status: "approved" });
  return changeStatus(requestId, customerId, "QUOTE_APPROVED", "Customer approved quotation");
}

export async function createMockPayment(requestId: string, customerId: string, method: "cash" | "card" | "online") {
  const request = await ServiceRequest.findOne({ _id: requestId, customer: customerId }).populate("quotation");
  if (!request || !request.quotation) throw new AppError(404, "Payable request not found");
  const amount = (request.quotation as unknown as { total: number }).total;
  const payment = await Payment.create({ request: requestId, customer: customerId, amount, method, status: "paid", receiptNumber: `EX-${Date.now()}` });
  request.set("payment", payment._id);
  await request.save();
  await changeStatus(requestId, customerId, "COMPLETED", "Mock development payment completed");
  return payment;
}

export async function createReview(requestId: string, customerId: string, rating: number, comment?: string) {
  const request = await ServiceRequest.findOne({ _id: requestId, customer: customerId });
  if (!request || request.currentStatus !== "COMPLETED") throw new AppError(409, "Only completed requests can be reviewed");
  const review = await Review.create({ request: requestId, customer: customerId, mechanic: request.assignedMechanic, rating, comment });
  request.set("review", review._id);
  await request.save();
  return review;
}

export async function createInspection(requestId: string, mechanicId: string, notes: string) {
  const inspection = await Inspection.create({ request: requestId, mechanic: mechanicId, notes, detectedProblems: [], requiredParts: [] });
  await ServiceRequest.findByIdAndUpdate(requestId, { inspection: inspection._id });
  return inspection;
}
