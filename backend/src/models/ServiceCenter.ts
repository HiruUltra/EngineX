import mongoose, { Schema, Types } from "mongoose";

const serviceCenterSchema = new Schema(
  {
    name: { type: String, required: true },
    manager: { type: Types.ObjectId, ref: "User" },
    phone: String,
    address: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    },
    categories: [{ type: Types.ObjectId, ref: "ServiceCategory" }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

serviceCenterSchema.index({ location: "2dsphere" });
export const ServiceCenter = mongoose.model("ServiceCenter", serviceCenterSchema);
