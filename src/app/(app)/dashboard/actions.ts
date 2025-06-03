"use server";

import { PrismaClient, Prisma } from "@prisma/client";
import { getCurrentTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { WhatsappApiService } from "@/lib/whatsapp/whatsapp-api";

const prisma = new PrismaClient();

// Types for the dashboard
export interface ConversationFE {
  id: string;
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  channel: string;
  channelSpecificId?: string;
  status: string;
  title?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  assignedToUserId?: string;
  assignedAgentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageFE {
  id: string;
  conversationId: string;
  content: string;
  messageType: string;
  sender: string;
  senderUserId?: string;
  senderUserName?: string;
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  imageUrl?: string;
  fileUrl?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export async function getConversations(): Promise<ConversationFE[]> {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    // Optimized query with selective includes
    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
      },
      select: {
        id: true,
        leadId: true,
        channel: true,
        channelSpecificId: true,
        status: true,
        title: true,
        lastMessageAt: true,
        unreadCount: true,
        assignedToUserId: true,
        createdAt: true,
        updatedAt: true,
        lead: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      leadId: conv.leadId || undefined,
      leadName: conv.lead?.name || undefined,
      leadEmail: conv.lead?.email || undefined,
      channel: conv.channel.toLowerCase(),
      channelSpecificId: conv.channelSpecificId || undefined,
      status: conv.status.toLowerCase(),
      title: conv.title || undefined,
      lastMessageAt: conv.lastMessageAt || undefined,
      unreadCount: conv.unreadCount,
      assignedToUserId: conv.assignedToUserId || undefined,
      assignedAgentName: conv.assignedTo?.user?.fullName || undefined,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw new Error(
      "Could not fetch conversations. Database operation failed."
    );
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<MessageFE[]> {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    // Optimized query with selective fields
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
        tenantId: tenant.id,
        deletedAt: null,
      },
      select: {
        id: true,
        conversationId: true,
        content: true,
        messageType: true,
        sender: true,
        senderUserId: true,
        isRead: true,
        deliveredAt: true,
        readAt: true,
        imageUrl: true,
        fileUrl: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        senderUser: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      messageType: msg.messageType.toLowerCase(),
      sender: msg.sender.toLowerCase(),
      senderUserId: msg.senderUserId || undefined,
      senderUserName: msg.senderUser?.user?.fullName || undefined,
      isRead: msg.isRead,
      deliveredAt: msg.deliveredAt || undefined,
      readAt: msg.readAt || undefined,
      imageUrl: msg.imageUrl || undefined,
      fileUrl: msg.fileUrl || undefined,
      metadata: msg.metadata || undefined,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Could not fetch messages. Database operation failed.");
  }
}

export async function sendMessage(
  conversationId: string,
  content: string,
  messageType: string = "TEXT"
): Promise<MessageFE> {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    // Verificar que la conversación existe y pertenece al tenant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: tenant.id,
        deletedAt: null,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or access denied");
    }

    // Obtener la configuración del canal de WhatsApp para este tenant
    const whatsappChannel = await prisma.channel.findFirst({
      where: {
        tenantId: tenant.id,
        channelType: "WHATSAPP",
        status: "CONNECTED",
        deletedAt: null,
      },
    });

    if (
      !whatsappChannel ||
      !whatsappChannel.accessToken ||
      !whatsappChannel.phoneNumberId
    ) {
      throw new Error("WhatsApp channel not configured or not connected");
    }

    // Obtener el número de WhatsApp del destinatario
    const recipientNumber =
      conversation.channelSpecificId || conversation.whatsappPhoneNumber;
    if (!recipientNumber) {
      throw new Error("Recipient WhatsApp number not found");
    }

    let whatsappMessageId: string | undefined;
    let deliveryStatus = "PENDING";

    try {
      // Enviar mensaje a WhatsApp
      const whatsappService = new WhatsappApiService({
        phoneNumberId: whatsappChannel.phoneNumberId,
        accessToken: whatsappChannel.accessToken,
      });

      const whatsappResponse = await whatsappService.sendTextMessage(
        recipientNumber,
        content
      );

      if (
        whatsappResponse &&
        whatsappResponse.messages &&
        whatsappResponse.messages[0]
      ) {
        whatsappMessageId = whatsappResponse.messages[0].id;
        deliveryStatus = "SENT";
        console.log("✅ Mensaje enviado a WhatsApp:", whatsappMessageId);
      }
    } catch (whatsappError) {
      console.error("❌ Error enviando mensaje a WhatsApp:", whatsappError);
      // Continuamos guardando el mensaje en la BD aunque falle el envío a WhatsApp
      deliveryStatus = "FAILED";
    }

    const message = await prisma.$transaction(async (prismaTx) => {
      // Crear el mensaje
      const newMessage = await prismaTx.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conversationId,
          content: content,
          messageType: messageType.toUpperCase() as any,
          sender: "AGENT",
          isRead: true, // Los mensajes del agente se marcan como leídos automáticamente
          deliveredAt: deliveryStatus === "SENT" ? new Date() : null,
          readAt: new Date(),
          metadata: {
            whatsappMessageId,
            deliveryStatus,
            sentAt: new Date().toISOString(),
          },
        },
        include: {
          senderUser: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Actualizar la conversación con el timestamp del último mensaje
      await prismaTx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return newMessage;
    });

    revalidatePath("/dashboard");
    revalidatePath("/conversations");

    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      messageType: message.messageType.toLowerCase(),
      sender: message.sender.toLowerCase(),
      senderUserId: message.senderUserId || undefined,
      senderUserName: message.senderUser?.user?.fullName || undefined,
      isRead: message.isRead,
      deliveredAt: message.deliveredAt || undefined,
      readAt: message.readAt || undefined,
      imageUrl: message.imageUrl || undefined,
      fileUrl: message.fileUrl || undefined,
      metadata: message.metadata || undefined,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error(
      `Could not send message: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function markConversationAsRead(
  conversationId: string
): Promise<void> {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    await prisma.$transaction(async (prismaTx) => {
      // Marcar todos los mensajes no leídos como leídos
      await prismaTx.message.updateMany({
        where: {
          conversationId: conversationId,
          tenantId: tenant.id,
          isRead: false,
          sender: "USER", // Solo marcar mensajes del usuario como leídos
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Resetear el contador de mensajes no leídos
      await prismaTx.conversation.update({
        where: {
          id: conversationId,
          tenantId: tenant.id,
        },
        data: {
          unreadCount: 0,
        },
      });
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    throw new Error(
      "Could not mark conversation as read. Database operation failed."
    );
  }
}

export async function updateConversationStatus(
  conversationId: string,
  status: string
): Promise<void> {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    await prisma.conversation.update({
      where: {
        id: conversationId,
        tenantId: tenant.id,
      },
      data: {
        status: status.toUpperCase() as any,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error updating conversation status:", error);
    throw new Error(
      "Could not update conversation status. Database operation failed."
    );
  }
}
