"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { WhatsappApiService } from "@/lib/whatsapp/whatsapp-api";

/**
 * Obtiene las plantillas de mensajes de WhatsApp almacenadas en la base de datos
 */
export async function getTemplates() {
  try {
    const tenant = await getCurrentTenant();

    if (!tenant?.id) {
      return { error: "No se pudo determinar el tenant actual" };
    }

    // Obtener las plantillas de la base de datos
    const templates = await db.whatsappTemplate.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: templates,
    };
  } catch (error) {
    console.error("Error obteniendo plantillas:", error);
    return {
      error: "Error al obtener las plantillas de WhatsApp",
    };
  }
}

/**
 * Actualiza las plantillas de mensajes desde la API de WhatsApp
 */
export async function refreshTemplates() {
  try {
    const tenant = await getCurrentTenant();

    if (!tenant?.id) {
      return { error: "No se pudo determinar el tenant actual" };
    }

    // Obtener la configuración de WhatsApp
    const config = await db.whatsappConfiguration.findFirst({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!config) {
      return {
        success: false,
        error: "No se encontró una configuración activa de WhatsApp",
      };
    }

    // Crear instancia del servicio de WhatsApp
    const whatsapp = new WhatsappApiService({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
    });

    // Obtener plantillas desde la API de WhatsApp
    const templates = await whatsapp.getMessageTemplates();

    if (!templates || !Array.isArray(templates)) {
      return {
        success: false,
        error: "No se pudieron obtener las plantillas de mensajes",
      };
    }

    // Eliminar plantillas existentes y crear nuevas
    await db.$transaction(async (tx) => {
      // Eliminar plantillas existentes para este tenant
      await tx.whatsappTemplate.deleteMany({
        where: { tenantId: tenant.id },
      });

      // Crear nuevas plantillas
      for (const template of templates) {
        await tx.whatsappTemplate.create({
          data: {
            name: template.name,
            status: template.status,
            category: template.category,
            language: template.language,
            components: template.components,
            tenantId: tenant.id,
          },
        });
      }
    });

    // Revalidar rutas para refrescar los datos
    revalidatePath("/settings/whatsapp/templates");

    return {
      success: true,
      message: "Plantillas actualizadas correctamente",
      count: templates.length,
    };
  } catch (error: any) {
    console.error("Error actualizando plantillas:", error);

    let errorMessage = "Error al actualizar las plantillas";
    if (error.response?.data?.error?.message) {
      errorMessage = `Error de WhatsApp API: ${error.response.data.error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
