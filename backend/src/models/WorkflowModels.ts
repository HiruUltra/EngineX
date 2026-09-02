import mongoose, { Schema, Types } from "mongoose";

export const MechanicLocation = mongoose.model(
  "MechanicLocation",
  new Schema(
    {
      mechanic: { type: Types.ObjectId, ref: "User", required: true, index: true },
      request: { type: Types.ObjectId, ref: "ServiceRequest" },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }
      },
      heading: Number,
      speedKph: Number
    },
    { timestamps: true }
  ).index({ location: "2dsphere" })
);

export const Inspection = mongoose.model("Inspection", new Schema({
  request: { type: Types.ObjectId, ref: "ServiceRequest", required: true },
  mechanic: { type: Types.ObjectId, ref: "User", required: true },
  notes: String,
  detectedProblems: [{ type: String }],
  requiredParts: [{ name: String, quantity: Number, estimatedCost: Number }],
  attachments: [{ type: String }]
}, { timestamps: true }));

export const Quotation = mongoose.model("Quotation", new Schema({
  request: { type: Types.ObjectId, ref: "ServiceRequest", required: true },
  mechanic: { type: Types.ObjectId, ref: "User", required: true },
  labourFee: { type: Number, default: 0 },
  partsCost: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  total: { type: Number, required: true },
  estimatedRepairMinutes: Number,
  expiresAt: Date,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true }));

export const Payment = mongoose.model("Payment", new Schema({
  request: { type: Types.ObjectId, ref: "ServiceRequest", required: true },
  customer: { type: Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["cash", "card", "online"], required: true },
  provider: { type: String, default: "mock" },
  status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  receiptNumber: String
}, { timestamps: true }));

export const Message = mongoose.model("Message", new Schema({
  request: { type: Types.ObjectId, ref: "ServiceRequest", required: true },
  sender: { type: Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true }
}, { timestamps: true }));

export const Notification = mongoose.model("Notification", new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true, index: true },
  title: String,
  body: String,
  readAt: Date
}, { timestamps: true }));

export const Review = mongoose.model("Review", new Schema({
  request: { type: Types.ObjectId, ref: "ServiceRequest", required: true },
  customer: { type: Types.ObjectId, ref: "User", required: true },
  mechanic: { type: Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String
}, { timestamps: true }));

export const AuditLog = mongoose.model("AuditLog", new Schema({
  actor: { type: Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  entity: String,
  entityId: String,
  metadata: Schema.Types.Mixed
}, { timestamps: true }));

export const RefreshToken = mongoose.model("RefreshToken", new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date
}, { timestamps: true }));
