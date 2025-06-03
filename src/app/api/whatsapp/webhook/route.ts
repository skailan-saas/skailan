/**
 * WhatsApp Webhook Handler
 *
 * This webhook handles:
 * 1. Webhook verification for WhatsApp Business API
 * 2. Incoming messages from customers
 * 3. Status updates for sent messages
 *
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  Conversation,
  Message,
  ConversationChannel,
  MessageType,
  MessageSender,
  WhatsappMessageStatus,
} from "@prisma/client";
import { markWhatsappMessageAsRead } from "@/lib/whatsapp/whatsapp-api";

const prisma = new PrismaClient();

/**
 * GET handler for webhook verification
 * Meta sends a verification request with a challenge to confirm webhook ownership
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // Extract verification parameters sent by Meta
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify that the request is coming from Meta
  if (mode !== "subscribe") {
    return new NextResponse("Invalid mode parameter", { status: 400 });
  }

  if (!token || !challenge) {
    return new NextResponse("Missing required parameters", { status: 400 });
  }

  try {
    // Look up the tenant based on the verify token
    const whatsappConfig = await prisma.whatsappConfiguration.findFirst({
      where: {
        webhookVerifyToken: token,
        isActive: true,
      },
    });

    if (!whatsappConfig) {
      console.error("Invalid verify token:", token);
      return new NextResponse("Invalid verify token", { status: 403 });
    }

    // If the token matches, respond with the challenge to confirm verification
    console.log(
      "WhatsApp webhook verified successfully for tenant:",
      whatsappConfig.tenantId
    );
    return new NextResponse(challenge);
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}

/**
 * POST handler for incoming webhook data from WhatsApp
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Make sure this is a WhatsApp message webhook
    if (!body.object || body.object !== "whatsapp_business_account") {
      return new NextResponse("Invalid webhook payload", { status: 400 });
    }

    // Process each entry in the webhook
    for (const entry of body.entry) {
      // Get the phone number ID which helps us identify the tenant
      const phoneNumberId =
        entry.changes?.[0]?.value?.metadata?.phone_number_id;

      if (!phoneNumberId) {
        console.error("Missing phone number ID in webhook payload");
        continue;
      }

      // Find the WhatsApp configuration for this phone number
      const whatsappConfig = await prisma.whatsappConfiguration.findFirst({
        where: {
          phoneNumberId: phoneNumberId,
          isActive: true,
        },
        include: {
          tenant: true,
        },
      });

      if (!whatsappConfig) {
        console.error("Unknown phone number ID:", phoneNumberId);
        continue;
      }

      const tenantId = whatsappConfig.tenantId;

      // Process each change in the entry
      for (const change of entry.changes) {
        const value = change.value;

        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await processIncomingMessage(
              message,
              value.contacts?.[0],
              tenantId,
              phoneNumberId
            );
          }
        }

        // Handle message status updates
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            await processStatusUpdate(status, tenantId);
          }
        }
      }
    }

    // Always respond with a 200 OK to acknowledge receipt
    return new NextResponse("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 to prevent Meta from retrying
    return new NextResponse("Error processing webhook", { status: 200 });
  }
}

/**
 * Process an incoming message from WhatsApp
 */
async function processIncomingMessage(
  message: any,
  contact: any,
  tenantId: string,
  phoneNumberId: string
) {
  try {
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);
    const from = message.from; // Sender's WhatsApp phone number
    const profileName = contact?.profile?.name || null;

    // Find or create a conversation for this phone number
    let conversation = await prisma.conversation.findFirst({
      where: {
        tenantId,
        channel: ConversationChannel.WHATSAPP,
        channelSpecificId: from,
      },
    });

    if (!conversation) {
      // Create a new conversation
      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          channel: ConversationChannel.WHATSAPP,
          channelSpecificId: from,
          whatsappPhoneNumber: from,
          whatsappProfileName: profileName,
          title: profileName || `WhatsApp: ${from}`,
          status: "ACTIVE",
          lastMessageAt: timestamp,
          unreadCount: 1,
        },
      });

      console.log(
        `Created new WhatsApp conversation for ${from} in tenant ${tenantId}`
      );
    } else {
      // Update existing conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: timestamp,
          whatsappProfileName: profileName || conversation.whatsappProfileName,
          unreadCount: { increment: 1 },
        },
      });
    }

    // Try to find a lead with this phone number
    const lead = await prisma.lead.findFirst({
      where: {
        tenantId,
        phone: { contains: from.substring(from.length - 8) }, // Match by last 8 digits
      },
    });

    if (lead && !conversation.leadId) {
      // Link the conversation to the lead
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { leadId: lead.id },
      });
      conversation.leadId = lead.id;
    }

    // Extract message content and type
    let messageContent = "";
    let messageType: MessageType;
    let mediaUrl: string | null = null;
    let imageUrl: string | null = null;
    let fileUrl: string | null = null;

    // Determine message type and extract content
    if (message.text) {
      messageContent = message.text.body;
      messageType = MessageType.TEXT;
    } else if (message.image) {
      messageContent = message.image.caption || "[Image]";
      messageType = MessageType.IMAGE;
      mediaUrl = message.image.url || null;
      imageUrl = mediaUrl;
    } else if (message.audio) {
      messageContent = "[Audio]";
      messageType = MessageType.AUDIO;
      mediaUrl = message.audio.url || null;
      fileUrl = mediaUrl;
    } else if (message.video) {
      messageContent = message.video.caption || "[Video]";
      messageType = MessageType.VIDEO;
      mediaUrl = message.video.url || null;
      fileUrl = mediaUrl;
    } else if (message.document) {
      messageContent = message.document.caption || "[Document]";
      messageType = MessageType.FILE;
      mediaUrl = message.document.url || null;
      fileUrl = mediaUrl;
    } else if (message.location) {
      messageContent = `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
      messageType = MessageType.LOCATION;
    } else if (message.contacts) {
      messageContent = "[Contact]";
      messageType = MessageType.CONTACT;
    } else if (message.interactive) {
      if (message.interactive.type === "button_reply") {
        messageContent = `[Button: ${message.interactive.button_reply.title}]`;
      } else if (message.interactive.type === "list_reply") {
        messageContent = `[List: ${message.interactive.list_reply.title}]`;
      } else {
        messageContent = "[Interactive]";
      }
      messageType = MessageType.INTERACTIVE;
    } else {
      messageContent = "[Unsupported message type]";
      messageType = MessageType.TEXT;
    }

    // Store the message in the database
    const storedMessage = await prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        content: messageContent,
        messageType,
        sender: MessageSender.USER,
        whatsappMessageId: messageId,
        deliveredAt: timestamp,
        imageUrl,
        fileUrl,
        metadata: message,
      },
    });

    console.log(
      `Stored new WhatsApp message: ${messageId} in conversation ${conversation.id}`
    );

    // Mark the message as read in WhatsApp
    await markWhatsappMessageAsRead(
      {
        phoneNumberId: whatsappConfig.phoneNumberId,
        accessToken: whatsappConfig.accessToken,
      },
      messageId
    );

    // Create a task for new conversations
    if (!conversation.leadId && !conversation.assignedToUserId) {
      // This is a new conversation without a lead, create a task to review it
      await prisma.task.create({
        data: {
          tenantId,
          title: `Review WhatsApp conversation from ${profileName || from}`,
          description: `New WhatsApp conversation received from ${
            profileName || from
          }. First message: "${messageContent.substring(0, 100)}${
            messageContent.length > 100 ? "..." : ""
          }"`,
          status: "PENDING",
          priority: "MEDIUM",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        },
      });
    }

    return storedMessage;
  } catch (error) {
    console.error("Error processing incoming WhatsApp message:", error);
    throw error;
  }
}

/**
 * Process a status update for a sent message
 */
async function processStatusUpdate(status: any, tenantId: string) {
  try {
    const messageId = status.id;
    const statusType = status.status; // sent, delivered, read, failed
    const timestamp = new Date(parseInt(status.timestamp) * 1000);

    let whatsappStatus: WhatsappMessageStatus;
    switch (statusType) {
      case "sent":
        whatsappStatus = WhatsappMessageStatus.SENT;
        break;
      case "delivered":
        whatsappStatus = WhatsappMessageStatus.DELIVERED;
        break;
      case "read":
        whatsappStatus = WhatsappMessageStatus.READ;
        break;
      case "failed":
        whatsappStatus = WhatsappMessageStatus.FAILED;
        break;
      default:
        whatsappStatus = WhatsappMessageStatus.SENT;
    }

    // Find the message in our database
    const message = await prisma.message.findFirst({
      where: {
        tenantId,
        whatsappMessageId: messageId,
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      console.warn(
        `Message with WhatsApp ID ${messageId} not found in database`
      );
      return;
    }

    // Update the message status
    const updates: any = {
      whatsappStatus,
    };

    if (statusType === "delivered" && !message.deliveredAt) {
      updates.deliveredAt = timestamp;
    }

    if (statusType === "read" && !message.readAt) {
      updates.readAt = timestamp;
      updates.isRead = true;
    }

    await prisma.message.update({
      where: {
        id: message.id,
      },
      data: updates,
    });

    console.log(`Updated message ${messageId} status to ${statusType}`);
    return true;
  } catch (error) {
    console.error("Error processing WhatsApp status update:", error);
    return false;
  }
}
