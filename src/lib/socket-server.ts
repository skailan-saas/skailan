import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

export interface NextApiResponseWithSocket {
  socket: {
    server: SocketServer;
  };
}

export const initializeSocket = (server: SocketServer) => {
  if (!server.io) {
    console.log("🔌 Inicializando Socket.IO server...");

    const io = new SocketIOServer(server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("✅ Cliente conectado:", socket.id);

      // Unirse a una sala específica del tenant
      socket.on("join-tenant", (tenantId: string) => {
        socket.join(`tenant-${tenantId}`);
        console.log(`📡 Cliente ${socket.id} se unió al tenant ${tenantId}`);
      });

      // Unirse a una conversación específica
      socket.on("join-conversation", (conversationId: string) => {
        socket.join(`conversation-${conversationId}`);
        console.log(
          `💬 Cliente ${socket.id} se unió a la conversación ${conversationId}`
        );
      });

      socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
      });
    });

    server.io = io;
  }
  return server.io;
};

// Función para emitir actualizaciones de mensajes
export const emitMessageUpdate = (
  io: SocketIOServer,
  tenantId: string,
  conversationId: string,
  message: any
) => {
  // Emitir a todos los clientes del tenant
  io.to(`tenant-${tenantId}`).emit("message-received", {
    conversationId,
    message,
  });

  // Emitir específicamente a la conversación
  io.to(`conversation-${conversationId}`).emit("new-message", message);

  console.log(
    `📨 Mensaje emitido para tenant ${tenantId}, conversación ${conversationId}`
  );
};

// Función para emitir actualizaciones de conversaciones
export const emitConversationUpdate = (
  io: SocketIOServer,
  tenantId: string,
  conversation: any
) => {
  io.to(`tenant-${tenantId}`).emit("conversation-updated", conversation);
  console.log(`🔄 Conversación actualizada para tenant ${tenantId}`);
};
