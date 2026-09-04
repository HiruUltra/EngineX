/**
 * EngineX Full Database Seeder
 * Seeds: 1 ADMIN, 2 MANAGERs, 3 CUSTOMERs, 4 MECHANICs
 * Run: npm run seed
 */
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "./config/db.js";
import { CustomerProfile, MechanicProfile } from "./models/Profiles.js";
import { ServiceCategory } from "./models/ServiceCategory.js";
import { ServiceCenter } from "./models/ServiceCenter.js";
import { ServiceRequest } from "./models/ServiceRequest.js";
import { User } from "./models/User.js";
import { Vehicle } from "./models/Vehicle.js";
import {
  AuditLog,
  Inspection,
  MechanicLocation,
  Notification,
  Payment,
  Quotation,
  RegistrationPayment,
  Review
} from "./models/WorkflowModels.js";

const PASSWORD = "EngineXDemo123!";
const HASH = await bcrypt.hash(PASSWORD, 12);

async function seed() {
  await connectDb();

  // ── Wipe everything ────────────────────────────────────────────────────────
  console.log("🗑  Wiping existing data…");
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    ServiceCategory.deleteMany({}),
    ServiceCenter.deleteMany({}),
    ServiceRequest.deleteMany({}),
    MechanicProfile.deleteMany({}),
    CustomerProfile.deleteMany({}),
    Payment.deleteMany({}),
    Quotation.deleteMany({}),
    Review.deleteMany({}),
    Inspection.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    MechanicLocation.deleteMany({}),
    RegistrationPayment.deleteMany({})
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log("👤 Creating users…");
  const [
    admin,
    manager1,
    manager2,
    customer1,
    customer2,
    customer3,
    mechanic1,
    mechanic2,
    mechanic3,
    mechanic4
  ] = await User.create([
    // ADMIN
    {
      name: "Admin Nethmi",
      email: "admin@enginex.lk",
      phone: "+94770000001",
      role: "ADMIN",
      passwordHash: HASH,
      isActive: true,
      theme: "dark"
    },
    // MANAGERs
    {
      name: "Manager Kavinda",
      email: "manager@enginex.lk",
      phone: "+94770000002",
      role: "MANAGER",
      passwordHash: HASH,
      isActive: true,
      theme: "dark"
    },
    {
      name: "Manager Priyanka",
      email: "manager2@enginex.lk",
      phone: "+94770000012",
      role: "MANAGER",
      passwordHash: HASH,
      isActive: true,
      theme: "dark"
    },
    // CUSTOMERs
    {
      name: "Amaya Perera",
      email: "customer@enginex.lk",
      phone: "+94770000003",
      role: "CUSTOMER",
      passwordHash: HASH,
      isActive: true,
      theme: "dark"
    },
    {
      name: "Dinuka Silva",
      email: "dinuka@example.lk",
      phone: "+94770000004",
      role: "CUSTOMER",
      passwordHash: HASH,
      isActive: true,
      theme: "dark"
    },
    {
      name: "Fathima Rizvy",
      email: "fathima@example.lk",
      phone: "+94770000005",
      role: "CUSTOMER",
      passwordHash: HASH,
      isActive: true,
      theme: "dark"
    },
    // MECHANICs
    {
      name: "Sahan Fernando",
      email: "mechanic@enginex.lk",
      phone: "+94770000006",
      role: "MECHANIC",
      passwordHash: HASH,
      avatarUrl: "https://i.pravatar.cc/160?img=12",
      isActive: true,
      theme: "dark"
    },
    {
      name: "Ruwan Jayasinghe",
      email: "ruwan@example.lk",
      phone: "+94770000007",
      role: "MECHANIC",
      passwordHash: HASH,
      avatarUrl: "https://i.pravatar.cc/160?img=15",
      isActive: true,
      theme: "dark"
    },
    {
      name: "Tharushi Bandara",
      email: "tharushi@example.lk",
      phone: "+94770000008",
      role: "MECHANIC",
      passwordHash: HASH,
      avatarUrl: "https://i.pravatar.cc/160?img=20",
      isActive: true,
      theme: "dark"
    },
    {
      name: "Ishan Madusanka",
      email: "ishan@example.lk",
      phone: "+94770000009",
      role: "MECHANIC",
      passwordHash: HASH,
      avatarUrl: "https://i.pravatar.cc/160?img=25",
      isActive: true,
      theme: "dark"
    }
  ]);

  // ── Customer Profiles ──────────────────────────────────────────────────────
  console.log("🙍 Creating customer profiles…");
  await CustomerProfile.create([
    {
      user: customer1._id,
      savedAddresses: [{ label: "Home", address: "Borella, Colombo 08" }],
      emergencyContact: { name: "Roshan Perera", phone: "+94770001001" },
      notificationPreferences: { sms: true, email: true, push: true }
    },
    {
      user: customer2._id,
      savedAddresses: [{ label: "Office", address: "Rajagiriya, Kotte" }],
      notificationPreferences: { sms: true, email: true, push: false }
    },
    {
      user: customer3._id,
      notificationPreferences: { sms: false, email: true, push: true }
    }
  ]);

  // ── Service Categories ─────────────────────────────────────────────────────
  console.log("🔧 Creating service categories…");
  const categories = await ServiceCategory.create([
    { name: "Engine problem",     description: "Diagnostics, overheating, breakdown repairs", supportedVehicleTypes: ["car", "van", "truck", "bus"], isActive: true },
    { name: "Battery issue",      description: "Jump start and battery replacement",           supportedVehicleTypes: ["motorcycle", "three-wheeler", "car", "van"], isActive: true },
    { name: "Flat tyre",          description: "Tyre change and puncture assistance",          supportedVehicleTypes: ["motorcycle", "three-wheeler", "car", "van", "truck"], isActive: true },
    { name: "Towing request",     description: "Safe towing to a service center",             supportedVehicleTypes: ["car", "van", "truck"], isActive: true },
    { name: "Overheating",        description: "Radiator and coolant failure repairs",        supportedVehicleTypes: ["car", "van", "truck", "bus"], isActive: true },
    { name: "Electrical fault",   description: "Wiring, fuse and sensor faults",             supportedVehicleTypes: ["car", "van", "motorcycle", "three-wheeler"], isActive: true },
    { name: "Fuel delivery",      description: "Emergency fuel delivery",                     supportedVehicleTypes: ["car", "van", "motorcycle", "three-wheeler"], isActive: true },
    { name: "Other assistance",   description: "Any other roadside assistance",               supportedVehicleTypes: ["motorcycle", "three-wheeler", "car", "van", "truck", "bus", "other"], isActive: true }
  ]);

  // ── Service Centers ────────────────────────────────────────────────────────
  console.log("🏢 Creating service centers…");
  const [center1, center2] = await ServiceCenter.create([
    {
      name: "EngineX Colombo Central",
      manager: manager1._id,
      phone: "+94112345678",
      address: "No. 18, Baseline Road, Colombo 08",
      location: { type: "Point", coordinates: [79.8786, 6.9147] },
      categories: categories.map((c) => c._id),
      isActive: true
    },
    {
      name: "EngineX Kandy Hub",
      manager: manager2._id,
      phone: "+94812345678",
      address: "45, Peradeniya Road, Kandy",
      location: { type: "Point", coordinates: [80.6337, 7.2906] },
      categories: [categories[0]._id, categories[2]._id, categories[3]._id],
      isActive: true
    }
  ]);

  // ── Registration Payments (for approved mechanics) ─────────────────────────
  console.log("💳 Creating mechanic registration payments…");
  const [regPay1, regPay2, regPay3] = await RegistrationPayment.create([
    { mechanic: mechanic1._id, amount: 2500, currency: "LKR", method: "card", status: "paid", receiptNumber: "REG-M001", paidAt: new Date("2025-03-01") },
    { mechanic: mechanic2._id, amount: 2500, currency: "LKR", method: "online", status: "paid", receiptNumber: "REG-M002", paidAt: new Date("2025-04-10") },
    { mechanic: mechanic3._id, amount: 2500, currency: "LKR", method: "card", status: "paid", receiptNumber: "REG-M003", paidAt: new Date("2025-05-20") }
  ]);
  // mechanic4 — paid but pending_verification (for manager demo)
  const regPay4 = await RegistrationPayment.create({
    mechanic: mechanic4._id, amount: 2500, currency: "LKR", method: "card", status: "paid", receiptNumber: "REG-M004", paidAt: new Date()
  });

  // ── Mechanic Profiles ──────────────────────────────────────────────────────
  console.log("🔩 Creating mechanic profiles…");
  const [mp1] = await MechanicProfile.create([
    {
      user: mechanic1._id,
      serviceCenter: center1._id,
      skills: ["engine", "battery", "electrical", "AC & cooling"],
      supportedVehicleTypes: ["car", "van", "three-wheeler"],
      isVerified: true,
      isOnline: true,
      profileStatus: "approved",
      registrationPayment: regPay1._id,
      currentLocation: { type: "Point", coordinates: [79.8612, 6.9271] },
      rating: 4.9,
      workload: 1
    },
    {
      user: mechanic2._id,
      serviceCenter: center1._id,
      skills: ["tyres", "battery", "brakes", "suspension"],
      supportedVehicleTypes: ["motorcycle", "three-wheeler", "car"],
      isVerified: true,
      isOnline: true,
      profileStatus: "approved",
      registrationPayment: regPay2._id,
      currentLocation: { type: "Point", coordinates: [79.897, 6.874] },
      rating: 4.7,
      workload: 0
    },
    {
      user: mechanic3._id,
      serviceCenter: center2._id,
      skills: ["towing", "engine", "transmission"],
      supportedVehicleTypes: ["truck", "bus", "van"],
      isVerified: true,
      isOnline: false,
      profileStatus: "approved",
      registrationPayment: regPay3._id,
      currentLocation: { type: "Point", coordinates: [80.6337, 7.2906] },
      rating: 4.8,
      workload: 0
    },
    {
      // Mechanic4 — pending_verification (shows up in manager review queue)
      user: mechanic4._id,
      serviceCenter: center1._id,
      skills: ["engine", "fuel system", "electrical"],
      supportedVehicleTypes: ["car", "van", "truck"],
      isVerified: false,
      isOnline: false,
      profileStatus: "pending_verification",
      registrationPayment: regPay4._id,
      verificationDocs: [],
      currentLocation: { type: "Point", coordinates: [79.9942, 6.8018] },
      rating: 4.6,
      workload: 0
    }
  ]);

  // ── Vehicles ───────────────────────────────────────────────────────────────
  console.log("🚗 Creating vehicles…");
  const [car1, car2, tuk, car3] = await Vehicle.create([
    { customer: customer1._id, registrationNumber: "WP CAB-4821", make: "Toyota", model: "Aqua",     manufactureYear: 2018, vehicleType: "car",           fuelType: "hybrid",  transmission: "automatic", colour: "Silver" },
    { customer: customer1._id, registrationNumber: "WP KAB-7741", make: "Honda",  model: "Fit",      manufactureYear: 2015, vehicleType: "car",           fuelType: "petrol",  transmission: "automatic", colour: "Blue" },
    { customer: customer2._id, registrationNumber: "WP AAA-1188", make: "Bajaj",  model: "RE",       manufactureYear: 2020, vehicleType: "three-wheeler", fuelType: "petrol",  transmission: "manual",    colour: "Green" },
    { customer: customer3._id, registrationNumber: "CP BDD-9021", make: "Honda",  model: "Vezel",    manufactureYear: 2019, vehicleType: "car",           fuelType: "hybrid",  transmission: "automatic", colour: "White" }
  ]);

  // ── Service Requests ───────────────────────────────────────────────────────
  console.log("📋 Creating service requests…");

  // 1. ACTIVE — EN_ROUTE (customer1 + mechanic1)
  const activeRequest = await ServiceRequest.create({
    customer: customer1._id,
    vehicle: car1._id,
    assignedMechanic: mechanic1._id,
    assignedServiceCenter: center1._id,
    serviceType: "repair",
    problemCategory: "battery issue",
    description: "Vehicle will not start near Borella.",
    urgency: "high",
    address: "Borella Junction, Colombo 08",
    breakdownLocation: { type: "Point", coordinates: [79.877, 6.914] },
    currentStatus: "EN_ROUTE",
    estimatedDistanceKm: 3.9,
    estimatedArrivalMinutes: 12,
    statusHistory: [
      { status: "SEARCHING", changedBy: customer1._id, note: "Customer requested assistance", at: new Date(Date.now() - 25 * 60000) },
      { status: "ASSIGNED",  changedBy: mechanic1._id,  note: "Automatic nearby assignment",   at: new Date(Date.now() - 20 * 60000) },
      { status: "ACCEPTED",  changedBy: mechanic1._id,  note: "Mechanic accepted job",          at: new Date(Date.now() - 18 * 60000) },
      { status: "EN_ROUTE",  changedBy: mechanic1._id,  note: "Mechanic started route",         at: new Date(Date.now() - 10 * 60000) }
    ],
    assignmentAttempts: [{ mechanic: mechanic1._id, score: 45, at: new Date(Date.now() - 20 * 60000) }]
  });
  await MechanicProfile.updateOne({ user: mechanic1._id }, { $set: { activeRequest: activeRequest._id } });

  // 2. COMPLETED with full workflow (customer1 + mechanic2)
  const completedReq = await ServiceRequest.create({
    customer: customer1._id,
    vehicle: car2._id,
    assignedMechanic: mechanic2._id,
    assignedServiceCenter: center1._id,
    serviceType: "inspection",
    problemCategory: "flat tyre",
    description: "Rear tyre puncture near Rajagiriya.",
    urgency: "normal",
    address: "Rajagiriya, Sri Jayawardenepura Kotte",
    breakdownLocation: { type: "Point", coordinates: [79.9025, 6.9094] },
    currentStatus: "COMPLETED",
    estimatedDistanceKm: 2.1,
    estimatedArrivalMinutes: 7,
    statusHistory: [
      { status: "SEARCHING",    changedBy: customer1._id, at: new Date(Date.now() - 5 * 3600000) },
      { status: "ASSIGNED",     changedBy: mechanic2._id, at: new Date(Date.now() - 4.8 * 3600000) },
      { status: "ACCEPTED",     changedBy: mechanic2._id, at: new Date(Date.now() - 4.7 * 3600000) },
      { status: "EN_ROUTE",     changedBy: mechanic2._id, at: new Date(Date.now() - 4.6 * 3600000) },
      { status: "ARRIVED",      changedBy: mechanic2._id, at: new Date(Date.now() - 4.5 * 3600000) },
      { status: "INSPECTING",   changedBy: mechanic2._id, at: new Date(Date.now() - 4.4 * 3600000) },
      { status: "QUOTE_SENT",   changedBy: mechanic2._id, at: new Date(Date.now() - 4.0 * 3600000) },
      { status: "QUOTE_APPROVED", changedBy: customer1._id, at: new Date(Date.now() - 3.8 * 3600000) },
      { status: "REPAIRING",    changedBy: mechanic2._id, at: new Date(Date.now() - 3.5 * 3600000) },
      { status: "PAYMENT_PENDING", changedBy: mechanic2._id, at: new Date(Date.now() - 3.0 * 3600000) },
      { status: "COMPLETED",    changedBy: customer1._id, at: new Date(Date.now() - 2.8 * 3600000) }
    ]
  });
  const inspection = await Inspection.create({
    request: completedReq._id,
    mechanic: mechanic2._id,
    notes: "Rear-right tyre completely flat. Side-wall damage. Replaced with spare.",
    detectedProblems: ["puncture", "side-wall damage"],
    requiredParts: [{ name: "Spare tyre", quantity: 1, estimatedCost: 2500 }]
  });
  const quote = await Quotation.create({
    request: completedReq._id,
    mechanic: mechanic2._id,
    labourFee: 1500,
    partsCost: 2500,
    serviceFee: 750,
    taxes: 0,
    total: 4750,
    estimatedRepairMinutes: 45,
    status: "approved"
  });
  const payment = await Payment.create({
    request: completedReq._id,
    customer: customer1._id,
    amount: 4750,
    method: "cash",
    status: "paid",
    receiptNumber: "EX-DEMO-001"
  });
  const review = await Review.create({
    request: completedReq._id,
    customer: customer1._id,
    mechanic: mechanic2._id,
    rating: 5,
    comment: "Fast and professional. Fixed the tyre within 30 minutes!"
  });
  completedReq.set("inspection", inspection._id);
  completedReq.set("quotation", quote._id);
  completedReq.set("payment", payment._id);
  completedReq.set("review", review._id);
  await completedReq.save();

  // 3. SEARCHING — no mechanic found yet (customer2)
  await ServiceRequest.create({
    customer: customer2._id,
    vehicle: tuk._id,
    serviceType: "repair",
    problemCategory: "engine problem",
    description: "Engine stopped suddenly near Nugegoda.",
    urgency: "emergency",
    address: "Nugegoda Town, Colombo",
    breakdownLocation: { type: "Point", coordinates: [79.8897, 6.8728] },
    currentStatus: "NO_MECHANIC_AVAILABLE",
    statusHistory: [
      { status: "SEARCHING",           changedBy: customer2._id, note: "Customer requested assistance" },
      { status: "NO_MECHANIC_AVAILABLE", note: "No verified online mechanic in range" }
    ]
  });

  // 4. QUOTE_SENT — waiting for customer approval (customer3)
  const quoteReq = await ServiceRequest.create({
    customer: customer3._id,
    vehicle: car3._id,
    assignedMechanic: mechanic2._id,
    assignedServiceCenter: center1._id,
    serviceType: "repair",
    problemCategory: "overheating",
    description: "Temperature gauge maxed out. Steam from bonnet.",
    urgency: "high",
    address: "Bambalapitiya, Colombo 04",
    breakdownLocation: { type: "Point", coordinates: [79.8583, 6.8942] },
    currentStatus: "QUOTE_SENT",
    estimatedDistanceKm: 1.5,
    estimatedArrivalMinutes: 5,
    statusHistory: [
      { status: "SEARCHING",  changedBy: customer3._id },
      { status: "ASSIGNED",   changedBy: mechanic2._id },
      { status: "ACCEPTED",   changedBy: mechanic2._id },
      { status: "EN_ROUTE",   changedBy: mechanic2._id },
      { status: "ARRIVED",    changedBy: mechanic2._id },
      { status: "INSPECTING", changedBy: mechanic2._id },
      { status: "QUOTE_SENT", changedBy: mechanic2._id, note: "Radiator hose replaced + coolant flush" }
    ]
  });
  const pendingQuote = await Quotation.create({
    request: quoteReq._id,
    mechanic: mechanic2._id,
    labourFee: 3500,
    partsCost: 4200,
    serviceFee: 1000,
    taxes: 440,
    total: 9140,
    estimatedRepairMinutes: 120,
    status: "pending"
  });
  quoteReq.set("quotation", pendingQuote._id);
  await quoteReq.save();

  // ── Notifications ──────────────────────────────────────────────────────────
  console.log("🔔 Creating notifications…");
  await Notification.create([
    { user: customer1._id, title: "Mechanic assigned",   body: "Sahan is on the way to your location. ETA 12 min." },
    { user: customer1._id, title: "Job completed",        body: "Your flat tyre job has been completed. Receipt: EX-DEMO-001" },
    { user: customer3._id, title: "Quote ready",          body: "Your mechanic sent a quote of LKR 9,140. Please review." },
    { user: mechanic1._id, title: "New job assigned",     body: "Battery issue at Borella Junction — customer is waiting." },
    { user: mechanic2._id, title: "Quote approved",       body: "Customer Fathima approved your quote. Start repair!" },
    { user: manager1._id,  title: "New mechanic pending", body: "Ishan Madusanka has submitted a mechanic profile for review." }
  ]);

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  console.log("📝 Creating audit logs…");
  await AuditLog.create([
    { actor: admin._id,    action: "mechanic.approve", entity: "MechanicProfile", entityId: String(mp1._id) },
    { actor: manager1._id, action: "user.update",      entity: "User",            entityId: String(customer1._id) }
  ]);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
✅ Seed complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Password for ALL accounts: ${PASSWORD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ADMIN     admin@enginex.lk
  MANAGER   manager@enginex.lk     (Colombo Central)
  MANAGER   manager2@enginex.lk    (Kandy Hub)
  CUSTOMER  customer@enginex.lk    (active EN_ROUTE job)
  CUSTOMER  dinuka@example.lk      (NO_MECHANIC_AVAILABLE)
  CUSTOMER  fathima@example.lk     (QUOTE_SENT — pending approval)
  MECHANIC  mechanic@enginex.lk    (approved, online, on active job)
  MECHANIC  ruwan@example.lk       (approved, online, sent quote)
  MECHANIC  tharushi@example.lk    (approved, offline — Kandy)
  MECHANIC  ishan@example.lk       (pending_verification — shows in manager queue)

  Active request ID: ${activeRequest._id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await disconnectDb();
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await disconnectDb();
  process.exit(1);
});
