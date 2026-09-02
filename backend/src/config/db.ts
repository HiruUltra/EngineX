import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(uri = env.MONGODB_URI) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
