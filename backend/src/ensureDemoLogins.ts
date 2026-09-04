/**
 * Ensures the 4 core demo accounts exist and are properly configured.
 * Safe to run at any time — uses upserts, does NOT wipe existing data.
 * Run: npm run ensure-demo-logins
 */
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "./config/db.js";
import { CustomerProfile, MechanicProfile } from "./models/Profiles.js";
import { ServiceCenter } from "./models/ServiceCenter.js";
import { ServiceRequest } from "./models/ServiceRequest.js";
import { User } from "./models/User.js";
import { Vehicle } from "./models/Vehicle.js";
import { RegistrationPayment } from "./models/WorkflowModels.js";

const PASSWORD = "EngineXDemo123!";

async function upsertUser(input: {
  name: string; email: string; phone: string;
  role: "ADMIN" | "MANAGER" | "CUSTOMER" | "MECHANIC"; avatarUrl?: string;
}) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  return User.findOneAndUpdate(
    { email: input.email },
    { $set: { ...input, passwordHash, isActive: true, theme: "dark" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

try {
  await connectDb();
  console.log("🔄 Ensuring demo accounts exist…");

  const admin    = await upsertUser({ name: "Admin Nethmi",    email: "admin@enginex.lk",    phone: "+94770000001", role: "ADMIN" });
  const manager  = await upsertUser({ name: "Manager Kavinda", email: "manager@enginex.lk",  phone: "+94770000002", role: "MANAGER" });
  const customer = await upsertUser({ name: "Amaya Perera",    email: "customer@enginex.lk", phone: "+94770000003", role: "CUSTOMER" });
  const mechanic = await upsertUser({
    name: "Sahan Fernando", email: "mechanic@enginex.lk",
    phone: "+94770000006", role: "MECHANIC",
    avatarUrl: "https://i.pravatar.cc/160?img=12"
  });

  // Customer profile
  await CustomerProfile.findOneAndUpdate(
    { user: customer._id },
    { $setOnInsert: { notificationPreferences: { sms: true, email: true, push: true } } },
    { upsert: true, new: true }
  );

  // Service center
  const center = await ServiceCenter.findOneAndUpdate(
    { name: "EngineX Colombo Central" },
    {
      $set: {
        manager: manager._id,
        phone: "+94112345678",
        address: "No. 18, Baseline Road, Colombo 08",
        location: { type: "Point", coordinates: [79.8786, 6.9147] },
        isActive: true
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Registration payment for mechanic
  let regPay = await RegistrationPayment.findOne({ mechanic: mechanic._id, status: "paid" });
  if (!regPay) {
    regPay = await RegistrationPayment.create({
      mechanic: mechanic._id,
      amount: 2500,
      currency: "LKR",
      method: "card",
      status: "paid",
      receiptNumber: "REG-DEMO-001",
      paidAt: new Date()
    });
  }

  // Mechanic profile — approved + online
  await MechanicProfile.findOneAndUpdate(
    { user: mechanic._id },
    {
      $set: {
        serviceCenter: center._id,
        skills: ["engine", "battery", "tyres", "electrical"],
        supportedVehicleTypes: ["motorcycle", "three-wheeler", "car", "van", "truck"],
        isVerified: true,
        isOnline: true,
        profileStatus: "approved",
        registrationPayment: regPay._id,
        rating: 4.9,
        currentLocation: { type: "Point", coordinates: [79.8612, 6.9271] }
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Vehicle for customer
  const vehicle = await Vehicle.findOneAndUpdate(
    { customer: customer._id, registrationNumber: "WP CAB-4821" },
    { $set: { make: "Toyota", model: "Aqua", manufactureYear: 2018, vehicleType: "car", fuelType: "hybrid", transmission: "automatic", colour: "Silver" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Active job (only create if mechanic has no open job)
  const openJob = await ServiceRequest.findOne({
    assignedMechanic: mechanic._id,
    currentStatus: { $nin: ["COMPLETED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_MECHANIC", "CANCELLED_BY_MANAGER", "DISPUTED"] }
  });

  const job = openJob ?? await ServiceRequest.create({
    customer: customer._id,
    vehicle: vehicle._id,
    assignedMechanic: mechanic._id,
    assignedServiceCenter: center._id,
    serviceType: "repair",
    problemCategory: "battery issue",
    description: "Vehicle will not start near Borella.",
    urgency: "high",
    address: "Borella Junction, Colombo 08",
    breakdownLocation: { type: "Point", coordinates: [79.877, 6.914] },
    currentStatus: "ASSIGNED",
    estimatedDistanceKm: 3.9,
    estimatedArrivalMinutes: 12,
    statusHistory: [
      { status: "SEARCHING", changedBy: customer._id,  note: "Customer requested assistance" },
      { status: "ASSIGNED",  changedBy: admin._id,      note: "Demo setup — auto-assigned" }
    ]
  });

  await MechanicProfile.updateOne({ user: mechanic._id }, { $set: { activeRequest: job._id } });

  console.log(`
✅ Demo accounts ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Password: ${PASSWORD}

  admin@enginex.lk    → ADMIN
  manager@enginex.lk  → MANAGER
  customer@enginex.lk → CUSTOMER
  mechanic@enginex.lk → MECHANIC (approved)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Active job: ${job._id}
`);
} finally {
  await disconnectDb();
}
