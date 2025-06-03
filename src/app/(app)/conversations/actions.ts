"use server";

// Re-exportar todas las funciones del dashboard para mantener compatibilidad
export {
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  updateConversationStatus,
  type ConversationFE,
  type MessageFE,
} from "@/app/(app)/dashboard/actions";
