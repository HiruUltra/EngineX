import http from "node:http";
import { Server } from "socket.io";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { registerSockets } from "./sockets/index.js";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: env.FRONTEND_URL, credentials: true } });
app.set("io", io);
registerSockets(io);

await connectDb();
server.listen(env.PORT, () => {
  console.log(`EngineX API listening on http://localhost:${env.PORT}`);
});
