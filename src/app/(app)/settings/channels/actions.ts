"use server";

import prisma from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { ConversationChannel } from "@prisma/client";
import { ChannelData, ChannelStatus } from "./types";
import { whatsappAPI } from "@/lib/whatsapp/api";

export async function getChannels() {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    const channels = await prisma.channel.findMany({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: channels };
  } catch (error) {
    console.error("Error al obtener canales:", error);
    return { success: false, error: "Error al obtener los canales" };
  }
}

export async function createChannel(data: ChannelData) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    // Generate webhook URL and verify token for channels that use webhooks
    let webhookUrl, verifyToken;
    const channelId = `${data.channelType.toLowerCase()}-${Date.now()}`;

    const channelsWithWebhooks = ["WHATSAPP", "MESSENGER", "INSTAGRAM", "API"];
    if (channelsWithWebhooks.includes(data.channelType)) {
      // Use tunnel domain from environment variable or fallback to localhost
      const tunnelDomain =
        process.env.TUNNEL_DOMAIN || `${tenant.subdomain}.localhost:3000`;
      const protocol = process.env.TUNNEL_DOMAIN ? "https" : "http";
      webhookUrl = `${protocol}://${tunnelDomain}/api/webhooks/${data.channelType.toLowerCase()}`;
      verifyToken = Math.random().toString(36).substring(2, 18).toUpperCase();
    }

    const channel = await prisma.channel.create({
      data: {
        tenantId: tenant.id,
        instanceName: data.instanceName,
        channelType: data.channelType,
        status: channelsWithWebhooks.includes(data.channelType)
          ? "PENDING_WEBHOOK"
          : "CONNECTED",
        webhookUrl,
        verifyToken,
        details: data.details,
        phoneNumberId: data.phoneNumberId,
        phoneNumber: data.phoneNumber,
        wabaId: data.wabaId,
        accessToken: data.accessToken,
        pageId: data.pageId,
        appSecret: data.appSecret,
        botToken: data.botToken,
        apiEndpoint: data.apiEndpoint,
      },
    });

    revalidatePath("/settings/channels");
    return { success: true, data: channel };
  } catch (error) {
    console.error("Error al crear canal:", error);
    return { success: false, error: "Error al crear el canal" };
  }
}

export async function updateChannel(id: string, data: Partial<ChannelData>) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    const channel = await prisma.channel.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        instanceName: data.instanceName,
        details: data.details,
        phoneNumberId: data.phoneNumberId,
        phoneNumber: data.phoneNumber,
        wabaId: data.wabaId,
        accessToken: data.accessToken,
        pageId: data.pageId,
        appSecret: data.appSecret,
        botToken: data.botToken,
        apiEndpoint: data.apiEndpoint,
      },
    });

    revalidatePath("/settings/channels");
    return { success: true, data: channel };
  } catch (error) {
    console.error("Error al actualizar canal:", error);
    return { success: false, error: "Error al actualizar el canal" };
  }
}

export async function deleteChannel(id: string) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    await prisma.channel.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath("/settings/channels");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar canal:", error);
    return { success: false, error: "Error al eliminar el canal" };
  }
}

export async function updateChannelStatus(id: string, status: ChannelStatus) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    const channel = await prisma.channel.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        status,
      },
    });

    revalidatePath("/settings/channels");
    return { success: true, data: channel };
  } catch (error) {
    console.error("Error al actualizar estado del canal:", error);
    return { success: false, error: "Error al actualizar el estado del canal" };
  }
}

export async function testWhatsAppConnection(channelId: string) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        tenantId: tenant.id,
        channelType: "WHATSAPP",
      },
    });

    if (!channel) {
      return { success: false, error: "Canal no encontrado" };
    }

    if (!channel.phoneNumberId || !channel.accessToken) {
      return { success: false, error: "Configuración de WhatsApp incompleta" };
    }

    // Test the connection using WhatsApp API
    const whatsappChannel = {
      id: channel.id,
      phoneNumberId: channel.phoneNumberId,
      accessToken: channel.accessToken,
      status: channel.status as any,
    };

    const isConnected = await whatsappAPI.testConnection(whatsappChannel);

    if (isConnected) {
      // Update channel status to connected
      await prisma.channel.update({
        where: { id: channelId },
        data: { status: "CONNECTED" },
      });

      revalidatePath("/settings/channels");
      return { success: true, message: "Conexión exitosa con WhatsApp API" };
    } else {
      // Update channel status to error
      await prisma.channel.update({
        where: { id: channelId },
        data: { status: "ERROR" },
      });

      revalidatePath("/settings/channels");
      return { success: false, error: "No se pudo conectar con WhatsApp API" };
    }
  } catch (error) {
    console.error("Error testing WhatsApp connection:", error);
    return { success: false, error: "Error al probar la conexión" };
  }
}

export async function sendTestMessage(
  channelId: string,
  phoneNumber: string,
  message: string
) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        tenantId: tenant.id,
        channelType: "WHATSAPP",
        status: "CONNECTED",
      },
    });

    if (!channel) {
      return { success: false, error: "Canal no encontrado o no conectado" };
    }

    if (!channel.phoneNumberId || !channel.accessToken) {
      return { success: false, error: "Configuración de WhatsApp incompleta" };
    }

    const whatsappChannel = {
      id: channel.id,
      phoneNumberId: channel.phoneNumberId,
      accessToken: channel.accessToken,
      status: channel.status as any,
    };

    // Send test message
    const result = await whatsappAPI.sendTextMessage(
      whatsappChannel,
      phoneNumber,
      message
    );

    return {
      success: true,
      message: "Mensaje de prueba enviado exitosamente",
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("Error sending test message:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al enviar mensaje de prueba",
    };
  }
}

export async function getWebhookInfo(channelId: string) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new Error("No se encontró el tenant");
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        tenantId: tenant.id,
      },
    });

    if (!channel) {
      return { success: false, error: "Canal no encontrado" };
    }

    return {
      success: true,
      data: {
        webhookUrl: channel.webhookUrl,
        verifyToken: channel.verifyToken,
        instructions: {
          whatsapp: {
            step1:
              "Ve a la configuración de tu aplicación de WhatsApp Business en Meta for Developers",
            step2: "En la sección 'Webhooks', configura la URL del webhook:",
            step3: `URL: ${channel.webhookUrl}`,
            step4: `Token de verificación: ${channel.verifyToken}`,
            step5:
              "Suscríbete a los eventos: messages, message_deliveries, message_reads",
            step6: "Guarda la configuración y verifica el webhook",
          },
        },
      },
    };
  } catch (error) {
    console.error("Error getting webhook info:", error);
    return {
      success: false,
      error: "Error al obtener información del webhook",
    };
  }
}
