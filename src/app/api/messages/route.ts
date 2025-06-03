import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { WhatsappApiService } from "@/lib/whatsapp/whatsapp-api";

export async function POST(req: Request) {
  try {
    // Verificar que el usuario esté autenticado
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar el tenant actual
    const tenant = await getCurrentTenant();
    if (!tenant?.id) {
      return NextResponse.json(
        { error: "No se pudo determinar el tenant actual" },
        { status: 400 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const {
      conversationId,
      content,
      messageType = "TEXT",
      recipientPhone,
      channel,
    } = await req.json();

    // Validar campos requeridos
    if (!conversationId || !content || !channel) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la conversación pertenezca al tenant actual
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: tenant.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversación no encontrada" },
        { status: 404 }
      );
    }

    // Obtener el TenantUser para el usuario actual
    const tenantUser = await db.tenantUser.findFirst({
      where: {
        tenantId: tenant.id,
        userId: user.id,
      },
    });

    if (!tenantUser) {
      return NextResponse.json(
        { error: "Usuario no pertenece a este tenant" },
        { status: 403 }
      );
    }

    // Crear un mensaje en la base de datos
    const message = await db.message.create({
      data: {
        conversationId,
        tenantId: tenant.id,
        content,
        messageType,
        sender: "AGENT",
        senderUserId: user.id,
        isRead: true, // Los mensajes enviados por el agente se consideran leídos automáticamente
      },
    });

    // Si el canal es WhatsApp, enviar el mensaje a través de la API de WhatsApp
    if (channel === "WHATSAPP" && recipientPhone) {
      // Obtener configuración de WhatsApp para este tenant
      const whatsappConfig = await db.whatsappConfiguration.findFirst({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
      });

      if (!whatsappConfig) {
        // Aún así guardamos el mensaje en la BD, pero marcamos un error
        await db.message.update({
          where: { id: message.id },
          data: {
            whatsappStatus: "FAILED",
            metadata: {
              error: "No hay configuración de WhatsApp activa para este tenant",
            },
          },
        });

        return NextResponse.json(
          {
            error: "No hay configuración de WhatsApp activa",
            messageId: message.id,
          },
          { status: 400 }
        );
      }

      // Inicializar el servicio de WhatsApp
      const whatsappService = new WhatsappApiService({
        phoneNumberId: whatsappConfig.phoneNumberId,
        accessToken: whatsappConfig.accessToken,
      });

      try {
        // Enviar el mensaje a WhatsApp
        const whatsappResponse = await whatsappService.sendTextMessage(
          recipientPhone,
          content
        );

        if (
          whatsappResponse &&
          whatsappResponse.messages &&
          whatsappResponse.messages[0]
        ) {
          // Actualizar el mensaje con el ID de WhatsApp
          await db.message.update({
            where: { id: message.id },
            data: {
              whatsappMessageId: whatsappResponse.messages[0].id,
              whatsappStatus: "SENT",
            },
          });
        }
      } catch (whatsappError) {
        console.error("Error enviando mensaje por WhatsApp:", whatsappError);

        // Actualizar el mensaje con el error
        await db.message.update({
          where: { id: message.id },
          data: {
            whatsappStatus: "FAILED",
            metadata: {
              error: "Error al enviar el mensaje a WhatsApp",
              details: JSON.stringify(whatsappError),
            },
          },
        });

        return NextResponse.json(
          {
            error: "Error al enviar el mensaje a WhatsApp",
            messageId: message.id,
          },
          { status: 500 }
        );
      }
    }

    // Actualizar la conversación
    await db.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: new Date(),
        status:
          conversation.status === "RESOLVED" ? "ACTIVE" : conversation.status,
        // Si no hay agente asignado, asignar al usuario actual
        assignedToUserId: conversation.assignedToUserId || user.id,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
    });
  } catch (error) {
    console.error("Error en API de mensajes:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
