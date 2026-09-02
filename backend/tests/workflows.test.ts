import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Vehicle } from "../src/models/Vehicle.js";
import { MechanicProfile } from "../src/models/Profiles.js";

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await MechanicProfile.syncIndexes();
});

let authIndex = 0;
async function auth(role = "CUSTOMER") {
  authIndex += 1;
  const passwordHash = await bcrypt.hash("EngineXDemo123!", 4);
  const user = await User.create({ name: `${role} User`, email: `${role.toLowerCase()}-${authIndex}@example.lk`, phone: `+9477000000${authIndex}`, role, passwordHash });
  const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: "EngineXDemo123!" });
  return { user, token: res.body.data.accessToken };
}

describe("EngineX workflows", () => {
  it("registers and logs in a customer without exposing passwordHash", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Amaya", email: "amaya@example.lk", phone: "+94771234567", password: "EngineXDemo123!", role: "CUSTOMER"
    });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("enforces vehicle ownership", async () => {
    const owner = await auth("CUSTOMER");
    const stranger = await auth("CUSTOMER");
    const vehicle = await Vehicle.create({ customer: owner.user._id, registrationNumber: "WP AA-1234", make: "Toyota", model: "Aqua", manufactureYear: 2018, vehicleType: "car", fuelType: "hybrid", transmission: "automatic", colour: "Silver" });
    const res = await request(app).patch(`/api/v1/vehicles/${vehicle._id}`).set("Authorization", `Bearer ${stranger.token}`).send({ colour: "Black" });
    expect(res.status).toBe(404);
  });

  it("creates a request and assigns a nearby mechanic", async () => {
    const customer = await auth("CUSTOMER");
    const mechanicPassword = await bcrypt.hash("EngineXDemo123!", 4);
    const mechanic = await User.create({ name: "Mechanic", email: "mechanic@example.lk", phone: "+94771111111", role: "MECHANIC", passwordHash: mechanicPassword });
    await MechanicProfile.create({ user: mechanic._id, isVerified: true, isOnline: true, supportedVehicleTypes: ["car"], currentLocation: { type: "Point", coordinates: [79.8612, 6.9271] } });
    const vehicle = await Vehicle.create({ customer: customer.user._id, registrationNumber: "WP CAB-4821", make: "Toyota", model: "Aqua", manufactureYear: 2018, vehicleType: "car", fuelType: "hybrid", transmission: "automatic", colour: "Silver" });
    const res = await request(app).post("/api/v1/requests").set("Authorization", `Bearer ${customer.token}`).send({
      vehicle: String(vehicle._id), serviceType: "repair", problemCategory: "battery issue", description: "Vehicle will not start",
      urgency: "high", address: "Colombo 07", longitude: 79.8612, latitude: 6.9271, images: []
    });
    expect(res.status).toBe(201);
    expect(res.body.data.currentStatus).toBe("ASSIGNED");
    expect(res.body.data.assignedMechanic).toBeTruthy();
  });

  it("rejects invalid status jumps", async () => {
    const customer = await auth("CUSTOMER");
    const vehicle = await Vehicle.create({ customer: customer.user._id, registrationNumber: "WP XY-9999", make: "Honda", model: "Fit", manufactureYear: 2017, vehicleType: "car", fuelType: "hybrid", transmission: "automatic", colour: "Blue" });
    const created = await request(app).post("/api/v1/requests").set("Authorization", `Bearer ${customer.token}`).send({
      vehicle: String(vehicle._id), serviceType: "repair", problemCategory: "engine problem", description: "Engine warning light",
      urgency: "normal", address: "Nugegoda", longitude: 79.89, latitude: 6.87, images: []
    });
    const res = await request(app).patch(`/api/v1/requests/${created.body.data._id}/status`).set("Authorization", `Bearer ${customer.token}`).send({ status: "COMPLETED" });
    expect(res.status).toBe(409);
  });
});
