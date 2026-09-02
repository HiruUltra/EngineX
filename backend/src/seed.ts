import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "./config/db.js";
import { MechanicProfile } from "./models/Profiles.js";
import { ServiceCategory } from "./models/ServiceCategory.js";
import { ServiceCenter } from "./models/ServiceCenter.js";
import { ServiceRequest } from "./models/ServiceRequest.js";
import { User } from "./models/User.js";
import { Vehicle } from "./models/Vehicle.js";
import { Payment, Quotation, Review, Notification } from "./models/WorkflowModels.js";

const password = "EngineXDemo123!";

async function seed() {
  await connectDb();
  await Promise.all([
    User.deleteMany({}), Vehicle.deleteMany({}), ServiceCategory.deleteMany({}), ServiceCenter.deleteMany({}),
    ServiceRequest.deleteMany({}), MechanicProfile.deleteMany({}), Payment.deleteMany({}), Quotation.deleteMany({}),
    Review.deleteMany({}), Notification.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash(password, 12);
  const [_admin, manager, customer, customer2, customer3, mechanic1, mechanic2, mechanic3, mechanic4] = await User.create([
    { name: "Admin Nethmi", email: "admin@enginex.lk", phone: "+94770000001", role: "ADMIN", passwordHash },
    { name: "Manager Kavinda", email: "manager@enginex.lk", phone: "+94770000002", role: "MANAGER", passwordHash },
    { name: "Customer Amaya", email: "customer@enginex.lk", phone: "+94770000003", role: "CUSTOMER", passwordHash },
    { name: "Customer Dinuka", email: "dinuka@example.lk", phone: "+94770000004", role: "CUSTOMER", passwordHash },
    { name: "Customer Fathima", email: "fathima@example.lk", phone: "+94770000005", role: "CUSTOMER", passwordHash },
    { name: "Mechanic Sahan", email: "mechanic@enginex.lk", phone: "+94770000006", role: "MECHANIC", passwordHash, avatarUrl: "https://i.pravatar.cc/160?img=12" },
    { name: "Mechanic Ruwan", email: "ruwan@example.lk", phone: "+94770000007", role: "MECHANIC", passwordHash, avatarUrl: "https://i.pravatar.cc/160?img=15" },
    { name: "Mechanic Tharushi", email: "tharushi@example.lk", phone: "+94770000008", role: "MECHANIC", passwordHash, avatarUrl: "https://i.pravatar.cc/160?img=20" },
    { name: "Mechanic Ishan", email: "ishan@example.lk", phone: "+94770000009", role: "MECHANIC", passwordHash, avatarUrl: "https://i.pravatar.cc/160?img=25" }
  ]);

  const categories = await ServiceCategory.create([
    { name: "Engine problem", description: "Diagnostics, overheating and breakdown repairs", supportedVehicleTypes: ["car", "van", "truck", "bus"] },
    { name: "Battery issue", description: "Jump start and battery replacement", supportedVehicleTypes: ["motorcycle", "three-wheeler", "car", "van"] },
    { name: "Flat tyre", description: "Tyre change and puncture assistance", supportedVehicleTypes: ["motorcycle", "three-wheeler", "car", "van", "truck"] },
    { name: "Towing request", description: "Safe towing to a service center", supportedVehicleTypes: ["car", "van", "truck"] }
  ]);

  const center = await ServiceCenter.create({
    name: "EngineX Colombo Central",
    manager: manager._id,
    phone: "+94112345678",
    address: "No. 18, Baseline Road, Colombo 08",
    location: { type: "Point", coordinates: [79.8786, 6.9147] },
    categories: categories.map((c) => c._id)
  });

  await MechanicProfile.create([
    { user: mechanic1._id, serviceCenter: center._id, isVerified: true, isOnline: true, supportedVehicleTypes: ["car", "van", "three-wheeler"], skills: ["engine", "battery"], currentLocation: { type: "Point", coordinates: [79.8612, 6.9271] }, rating: 4.9 },
    { user: mechanic2._id, serviceCenter: center._id, isVerified: true, isOnline: true, supportedVehicleTypes: ["motorcycle", "three-wheeler", "car"], skills: ["tyres", "battery"], currentLocation: { type: "Point", coordinates: [79.897, 6.874] }, rating: 4.7 },
    { user: mechanic3._id, serviceCenter: center._id, isVerified: true, isOnline: false, supportedVehicleTypes: ["truck", "bus", "van"], skills: ["towing"], currentLocation: { type: "Point", coordinates: [80.6337, 7.2906] }, rating: 4.8 },
    { user: mechanic4._id, serviceCenter: center._id, isVerified: true, isOnline: true, supportedVehicleTypes: ["car", "van", "truck"], skills: ["engine", "electrical"], currentLocation: { type: "Point", coordinates: [79.9942, 6.8018] }, rating: 4.6 }
  ]);

  const [vehicle] = await Vehicle.create([
    { customer: customer._id, registrationNumber: "WP CAB-4821", make: "Toyota", model: "Aqua", manufactureYear: 2018, vehicleType: "car", fuelType: "hybrid", transmission: "automatic", colour: "Silver" },
    { customer: customer2._id, registrationNumber: "WP AAA-1188", make: "Bajaj", model: "RE", manufactureYear: 2020, vehicleType: "three-wheeler", fuelType: "petrol", transmission: "manual", colour: "Green" },
    { customer: customer3._id, registrationNumber: "CP BDD-9021", make: "Honda", model: "Vezel", manufactureYear: 2019, vehicleType: "car", fuelType: "hybrid", transmission: "automatic", colour: "White" }
  ]);

  const active = await ServiceRequest.create({
    customer: customer._id,
    vehicle: vehicle._id,
    assignedMechanic: mechanic1._id,
    assignedServiceCenter: center._id,
    serviceType: "repair",
    problemCategory: "battery issue",
    description: "Vehicle will not start near Borella.",
    urgency: "high",
    address: "Borella Junction, Colombo",
    breakdownLocation: { type: "Point", coordinates: [79.877, 6.914] },
    currentStatus: "EN_ROUTE",
    estimatedDistanceKm: 3.9,
    estimatedArrivalMinutes: 12,
    statusHistory: [{ status: "SEARCHING" }, { status: "ASSIGNED" }, { status: "ACCEPTED" }, { status: "EN_ROUTE" }]
  });

  const completed = await ServiceRequest.create({
    customer: customer._id,
    vehicle: vehicle._id,
    assignedMechanic: mechanic2._id,
    assignedServiceCenter: center._id,
    serviceType: "inspection",
    problemCategory: "flat tyre",
    description: "Rear tyre puncture near Rajagiriya.",
    urgency: "normal",
    address: "Rajagiriya, Sri Jayawardenepura Kotte",
    breakdownLocation: { type: "Point", coordinates: [79.9025, 6.9094] },
    currentStatus: "COMPLETED",
    statusHistory: [{ status: "SEARCHING" }, { status: "ASSIGNED" }, { status: "COMPLETED" }]
  });
  const quote = await Quotation.create({ request: completed._id, mechanic: mechanic2._id, labourFee: 1500, partsCost: 2500, serviceFee: 750, taxes: 0, total: 4750, status: "approved" });
  const payment = await Payment.create({ request: completed._id, customer: customer._id, amount: 4750, method: "cash", status: "paid", receiptNumber: "EX-DEMO-001" });
  const review = await Review.create({ request: completed._id, customer: customer._id, mechanic: mechanic2._id, rating: 5, comment: "Fast and professional demo review." });
  completed.set("quotation", quote._id);
  completed.set("payment", payment._id);
  completed.set("review", review._id);
  await completed.save();
  await Notification.create({ user: customer._id, title: "Mechanic assigned", body: "Sahan is on the way to your location." });

  console.log(`Seeded EngineX demo data. Password for all demo accounts: ${password}. Active request: ${active._id}`);
  await disconnectDb();
}

seed().catch(async (error) => {
  console.error(error);
  await disconnectDb();
  process.exit(1);
});
