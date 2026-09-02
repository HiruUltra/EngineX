import mongoose, { Schema, Types } from "mongoose";

const vehicleSchema = new Schema(
  {
    customer: { type: Types.ObjectId, ref: "User", required: true, index: true },
    registrationNumber: { type: String, required: true, trim: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    manufactureYear: { type: Number, required: true },
    vehicleType: { type: String, enum: ["motorcycle", "three-wheeler", "car", "van", "truck", "bus", "other"], required: true },
    fuelType: { type: String, enum: ["petrol", "diesel", "hybrid", "electric", "other"], required: true },
    transmission: { type: String, enum: ["manual", "automatic", "other"], required: true },
    colour: { type: String, required: true },
    vin: String,
    notes: String,
    imageUrl: String
  },
  { timestamps: true }
);

vehicleSchema.index({ customer: 1, registrationNumber: 1 }, { unique: true });
export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
