import mongoose, { Schema } from "mongoose";
import { roles, type Role } from "./types.js";

export interface UserDoc extends mongoose.Document {
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  theme: "dark" | "light" | "system";
  auth0Sub?: string;
  googleId?: string;
  phoneVerified: boolean;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: roles, required: true },
    avatarUrl: String,
    isActive: { type: Boolean, default: true },
    theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
    auth0Sub: { type: String, sparse: true, unique: true },
    googleId: { type: String, sparse: true, unique: true },
    phoneVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDoc>("User", userSchema);
