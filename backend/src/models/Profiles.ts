import mongoose, { Schema, Types } from "mongoose";

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

export const CustomerProfile = mongoose.model(
  "CustomerProfile",
  new Schema(
    {
      user: { type: Types.ObjectId, ref: "User", required: true, unique: true },
      savedAddresses: [{ label: String, address: String, location: pointSchema }],
      emergencyContact: { name: String, phone: String },
      notificationPreferences: { sms: Boolean, email: Boolean, push: Boolean }
    },
    { timestamps: true }
  )
);

const mechanicProfileSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    serviceCenter: { type: Types.ObjectId, ref: "ServiceCenter" },
    skills: [{ type: String }],
    supportedVehicleTypes: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    activeRequest: { type: Types.ObjectId, ref: "ServiceRequest" },
    rating: { type: Number, default: 4.8 },
    workload: { type: Number, default: 0 },
    currentLocation: { type: pointSchema, index: "2dsphere" }
  },
  { timestamps: true }
);

export const MechanicProfile = mongoose.model("MechanicProfile", mechanicProfileSchema);
