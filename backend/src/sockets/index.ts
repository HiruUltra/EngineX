import type { Server } from "socket.io";
import { User } from "../models/User.js";
import { verifySocketToken } from "../services/authService.js";

export function registerSockets(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token = String(socket.handshake.auth.token || "");
      const payload = verifySocketToken(token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("Unauthorized"));
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string };
    socket.join(`user:${user.id}`);
    socket.on("request:join", (requestId: string) => socket.join(`request:${requestId}`));
    socket.on("request:leave", (requestId: string) => socket.leave(`request:${requestId}`));
    socket.on("mechanic:location-updated", (payload) => {
      if (payload?.requestId) socket.to(`request:${payload.requestId}`).emit("mechanic:location-updated", payload);
    });
    socket.on("message:created", (payload) => {
      if (payload?.requestId) socket.to(`request:${payload.requestId}`).emit("message:created", payload);
    });
  });
}
