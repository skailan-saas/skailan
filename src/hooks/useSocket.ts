import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (tenantId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    // Inicializar Socket.IO client
    const socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Conectado a Socket.IO:", socket.id);
      // Unirse al tenant
      socket.emit("join-tenant", tenantId);
    });

    socket.on("disconnect", () => {
      console.log("❌ Desconectado de Socket.IO");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión Socket.IO:", error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tenantId]);

  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join-conversation", conversationId);
    }
  };

  const onMessageReceived = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("message-received", callback);
    }
  };

  const onNewMessage = (callback: (message: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("new-message", callback);
    }
  };

  const onConversationUpdated = (callback: (conversation: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("conversation-updated", callback);
    }
  };

  const removeAllListeners = () => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
    }
  };

  return {
    socket: socketRef.current,
    joinConversation,
    onMessageReceived,
    onNewMessage,
    onConversationUpdated,
    removeAllListeners,
  };
};
