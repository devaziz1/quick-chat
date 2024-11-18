import { Server, Socket } from "socket.io";
import prisma from "./config/db.config.js";

interface customSocket extends Socket {
  room?: string;
}

export function setupServer(io: Server) {
  io.use((socket: customSocket, next) => {
    const room = socket.handshake.auth.room || socket.handshake.headers.room;
    if (!room) {
      return next(new Error("INVALID ROOM"));
    }

    socket.room = room;
    next();
  });

  io.on("connection", (socket: customSocket) => {
    socket.join(socket.room);
    console.log("A client connected", socket.id);

    socket.on("message", async (data) => {
      console.log("Received message:", data);

      await prisma.chats.create({
        data: data,
      });
      // socket.broadcast.emit("message", { success: true, data });

      socket.to(socket.room).emit("message", data);
    });

    socket.on("disconnect", () => {
      console.log("A client disconnected", socket.id);
    });
  });
}
