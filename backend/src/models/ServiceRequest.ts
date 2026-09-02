import mongoose, { Schema, Types } from "mongoose";
import { requestStatuses } from "./types.js";

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: requestStatuses, required: true },
    changedBy: { type: Types.ObjectId, ref: "User" },
    note: String,
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const serviceRequestSchema = new Schema(
  {
    customer: { type: Types.ObjectId, ref: "User", required: true, index: true },
    vehicle: { type: Types.ObjectId, ref: "Vehicle", required: true },
    assignedMechanic: { type: Types.ObjectId, ref: "User" },
    assignedServiceCenter: { type: Types.ObjectId, ref: "ServiceCenter" },
    serviceType: { type: String, enum: ["inspection", "repair", "towing"], required: true },
    problemCategory: { type: String, required: true },
    description: { type: String, required: true },
    urgency: { type: String, enum: ["low", "normal", "high", "emergency"], default: "normal" },
    images: [{ type: String }],
    breakdownLocation: { type: pointSchema, required: true, index: "2dsphere" },
    address: { type: String, required: true },
    destination: { address: String, location: pointSchema },
    currentStatus: { type: String, enum: requestStatuses, default: "SEARCHING", index: true },
    statusHistory: [statusHistorySchema],
    estimatedDistanceKm: Number,
    estimatedArrivalMinutes: Number,
    cancellationReason: String,
    inspection: { type: Types.ObjectId, ref: "Inspection" },
    quotation: { type: Types.ObjectId, ref: "Quotation" },
    payment: { type: Types.ObjectId, ref: "Payment" },
    review: { type: Types.ObjectId, ref: "Review" },
    assignmentAttempts: [{ mechanic: { type: Types.ObjectId, ref: "User" }, score: Number, at: Date }]
  },
  { timestamps: true }
);

export const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);
