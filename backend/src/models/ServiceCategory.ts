import mongoose, { Schema } from "mongoose";

const serviceCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    baseFee: { type: Number, default: 1500 },
    supportedVehicleTypes: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ServiceCategory = mongoose.model("ServiceCategory", serviceCategorySchema);
