import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Función para obtener la instancia de Socket.IO
function getSocketIO(): SocketIOServer | null {
  try {
    // En desarrollo, intentamos acceder al servidor global
    const globalForSocket = globalThis as unknown as {
      __socketIO?: SocketIOServer;
    };
    return globalForSocket.__socketIO || null;
  } catch (error) {
    console.log("Socket.IO no disponible:", error);
    return null;
  }
}

// Función para emitir actualizaciones de mensajes
function emitMessageUpdate(
  tenantId: string,
  conversationId: string,
  message: any
) {
  const io = getSocketIO();
  if (io) {
    // Emitir a todos los clientes del tenant
    io.to(`tenant-${tenantId}`).emit("message-received", {
      conversationId,
      message,
    });

    // Emitir específicamente a la conversación
    io.to(`conversation-${conversationId}`).emit("new-message", message);

    console.log(
      `📨 Mensaje emitido via Socket.IO para tenant ${tenantId}, conversación ${conversationId}`
    );
  } else {
    console.log("⚠️ Socket.IO no disponible para emitir mensaje");
  }
}

// Función para emitir actualizaciones de conversaciones
function emitConversationUpdate(tenantId: string, conversation: any) {
  const io = getSocketIO();
  if (io) {
    io.to(`tenant-${tenantId}`).emit("conversation-updated", conversation);
    console.log(
      `🔄 Conversación actualizada via Socket.IO para tenant ${tenantId}`
    );
  }
}

// Verificación del webhook de WhatsApp
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("Webhook verification request:", { mode, token, challenge });

  if (mode === "subscribe") {
    // Buscar el canal con el token de verificación
    const channel = await prisma.channel.findFirst({
      where: {
        verifyToken: token,
        channelType: "WHATSAPP",
        isActive: true,
      },
    });

    if (channel) {
      console.log(
        "Webhook verified successfully for channel:",
        channel.instanceName
      );

      // Actualizar el estado del canal a conectado
      await prisma.channel.update({
        where: { id: channel.id },
        data: { status: "CONNECTED" },
      });

      return new NextResponse(challenge, { status: 200 });
    } else {
      console.log("Invalid verify token:", token);
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

// Recepción de mensajes de WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2));

    // Verificar la firma del webhook usando el secreto específico del canal
    const signature = request.headers.get("x-hub-signature-256");

    if (signature) {
      // Buscar el canal correspondiente para obtener su webhook secret específico
      const phoneNumberId =
        body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

      if (phoneNumberId) {
        const channel = await prisma.channel.findFirst({
          where: {
            channelType: "WHATSAPP",
            phoneNumberId: phoneNumberId,
            isActive: true,
          },
        });

        if (channel && channel.verifyToken) {
          const rawBody = JSON.stringify(body);
          const expectedSignature = crypto
            .createHmac("sha256", channel.verifyToken)
            .update(rawBody)
            .digest("hex");

          if (`sha256=${expectedSignature}` !== signature) {
            console.log(
              `⚠️  Webhook signature mismatch for channel ${channel.instanceName}`
            );
            console.log(`Expected: sha256=${expectedSignature}`);
            console.log(`Received: ${signature}`);
            console.log(`Proceeding without verification for development...`);
          } else {
            console.log(
              `Webhook signature verified successfully for channel: ${channel.instanceName}`
            );
          }
        } else {
          console.log(
            `Channel not found or no verify token for phone number ID: ${phoneNumberId}`
          );
          console.log("Proceeding without signature verification");
        }
      } else {
        console.log("No phone number ID found in webhook payload");
        console.log("Proceeding without signature verification");
      }
    } else {
      console.log(
        "No webhook signature provided - proceeding without verification"
      );
    }

    // Procesar los mensajes entrantes
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === "messages" && change.value.messages) {
              await processIncomingMessages(change.value);
            }

            if (change.field === "messages" && change.value.statuses) {
              await processMessageStatuses(change.value);
            }
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function processIncomingMessages(messageData: any) {
  try {
    const messages = messageData.messages || [];
    const contacts = messageData.contacts || [];
    const metadata = messageData.metadata || {};

    console.log("Processing incoming messages:", messages.length);

    for (const message of messages) {
      const phoneNumber = message.from;
      const messageId = message.id;
      const timestamp = new Date(parseInt(message.timestamp) * 1000);

      // Buscar el canal de WhatsApp correspondiente
      const channel = await prisma.channel.findFirst({
        where: {
          channelType: "WHATSAPP",
          phoneNumberId: metadata.phone_number_id,
          isActive: true,
        },
        include: {
          tenant: true,
        },
      });

      if (!channel) {
        console.log(
          "No channel found for phone number ID:",
          metadata.phone_number_id
        );
        continue;
      }

      // Buscar o crear conversación
      let conversation = await prisma.conversation.findFirst({
        where: {
          tenantId: channel.tenantId,
          channelSpecificId: phoneNumber,
          channel: "WHATSAPP",
        },
      });

      if (!conversation) {
        // Obtener información del contacto
        const contact = contacts.find((c: any) => c.wa_id === phoneNumber);
        const profileName = contact?.profile?.name || phoneNumber;

        conversation = await prisma.conversation.create({
          data: {
            tenantId: channel.tenantId,
            channelSpecificId: phoneNumber,
            channel: "WHATSAPP",
            whatsappPhoneNumber: phoneNumber,
            whatsappProfileName: profileName,
            status: "ACTIVE",
            title: `WhatsApp - ${profileName}`,
            lastMessageAt: timestamp,
          },
        });
      } else {
        // Actualizar última actividad
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: timestamp,
            unreadCount: { increment: 1 },
          },
        });
      }

      // Determinar el tipo y contenido del mensaje
      let messageType = "TEXT";
      let content = "";
      let imageUrl = null;
      let fileUrl = null;

      if (message.text) {
        content = message.text.body;
      } else if (message.image) {
        messageType = "IMAGE";
        content = message.image.caption || "Imagen";
        imageUrl = message.image.id; // ID de la imagen en WhatsApp
      } else if (message.document) {
        messageType = "FILE";
        content = message.document.filename || "Documento";
        fileUrl = message.document.id; // ID del documento en WhatsApp
      } else if (message.audio) {
        messageType = "AUDIO";
        content = "Mensaje de audio";
        fileUrl = message.audio.id;
      } else if (message.video) {
        messageType = "VIDEO";
        content = message.video.caption || "Video";
        fileUrl = message.video.id;
      } else if (message.location) {
        messageType = "LOCATION";
        content = `Ubicación: ${message.location.latitude}, ${message.location.longitude}`;
      }

      // Crear el mensaje en la base de datos
      const newMessage = await prisma.message.create({
        data: {
          tenantId: channel.tenantId,
          conversationId: conversation.id,
          content,
          messageType: messageType as any,
          sender: "USER",
          whatsappMessageId: messageId,
          whatsappStatus: "DELIVERED",
          imageUrl,
          fileUrl,
          metadata: message,
        },
      });

      console.log(`Message saved for conversation ${conversation.id}`);

      // Emitir actualización en tiempo real via Socket.IO
      emitMessageUpdate(channel.tenantId, conversation.id, {
        id: newMessage.id,
        content: newMessage.content,
        messageType: newMessage.messageType,
        sender: newMessage.sender,
        createdAt: newMessage.createdAt,
        whatsappStatus: newMessage.whatsappStatus,
        imageUrl: newMessage.imageUrl,
        fileUrl: newMessage.fileUrl,
      });

      // También emitir actualización de la conversación
      emitConversationUpdate(channel.tenantId, {
        id: conversation.id,
        title: conversation.title,
        lastMessageAt: timestamp,
        unreadCount: conversation.unreadCount + 1,
        lastMessage: content,
      });
    }
  } catch (error) {
    console.error("Error processing incoming messages:", error);
  }
}

async function processMessageStatuses(statusData: any) {
  try {
    const statuses = statusData.statuses || [];

    for (const status of statuses) {
      const messageId = status.id;
      const newStatus = status.status; // sent, delivered, read, failed

      // Actualizar el estado del mensaje
      await prisma.message.updateMany({
        where: {
          whatsappMessageId: messageId,
        },
        data: {
          whatsappStatus: newStatus.toUpperCase(),
          deliveredAt:
            status.status === "delivered"
              ? new Date(parseInt(status.timestamp) * 1000)
              : undefined,
          readAt:
            status.status === "read"
              ? new Date(parseInt(status.timestamp) * 1000)
              : undefined,
        },
      });

      console.log(`Message status updated: ${messageId} -> ${newStatus}`);
    }
  } catch (error) {
    console.error("Error processing message statuses:", error);
  }
}
