"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { WhatsappConfigFormData, WhatsappApiResponse } from "./types";
import { WhatsappApiService } from "@/lib/whatsapp/whatsapp-api";

export async function getWhatsappConfig(): Promise<WhatsappConfigFormData | null> {
  try {
    const tenant = await getCurrentTenant();

    if (!tenant?.id) {
      throw new Error("No se pudo determinar el tenant actual");
    }

    const config = await db.whatsappConfiguration.findFirst({
      where: {
        tenantId: tenant.id,
      },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      accessToken: config.accessToken,
      webhookVerifyToken: config.webhookVerifyToken,
      displayPhoneNumber: config.displayPhoneNumber,
      isActive: config.isActive,
      businessName: config.businessName || "",
      businessDescription: config.businessDescription || "",
      businessWebsite: config.businessWebsite || "",
      businessEmail: config.businessEmail || "",
      businessAddress: config.businessAddress || "",
      businessVertical: config.businessVertical || "",
    };
  } catch (error) {
    console.error("Error obteniendo configuración WhatsApp:", error);
    throw new Error("Error al obtener la configuración de WhatsApp");
  }
}

export async function saveWhatsappConfig(
  formData: WhatsappConfigFormData
): Promise<WhatsappApiResponse> {
  try {
    const tenant = await getCurrentTenant();

    if (!tenant?.id) {
      return { error: "No se pudo determinar el tenant actual" };
    }

    // Validación básica
    if (
      !formData.phoneNumberId ||
      !formData.accessToken ||
      !formData.businessAccountId
    ) {
      return { error: "Faltan campos obligatorios" };
    }

    let result;

    if (formData.id) {
      // Actualizar configuración existente
      result = await db.whatsappConfiguration.update({
        where: {
          id: formData.id,
          tenantId: tenant.id,
        },
        data: {
          phoneNumberId: formData.phoneNumberId,
          businessAccountId: formData.businessAccountId,
          accessToken: formData.accessToken,
          webhookVerifyToken: formData.webhookVerifyToken,
          displayPhoneNumber: formData.displayPhoneNumber,
          isActive: formData.isActive,
          businessName: formData.businessName,
          businessDescription: formData.businessDescription,
          businessWebsite: formData.businessWebsite,
          businessEmail: formData.businessEmail,
          businessAddress: formData.businessAddress,
          businessVertical: formData.businessVertical,
        },
      });
    } else {
      // Crear nueva configuración
      result = await db.whatsappConfiguration.create({
        data: {
          phoneNumberId: formData.phoneNumberId,
          businessAccountId: formData.businessAccountId,
          accessToken: formData.accessToken,
          webhookVerifyToken: formData.webhookVerifyToken,
          displayPhoneNumber: formData.displayPhoneNumber,
          isActive: formData.isActive,
          businessName: formData.businessName,
          businessDescription: formData.businessDescription,
          businessWebsite: formData.businessWebsite,
          businessEmail: formData.businessEmail,
          businessAddress: formData.businessAddress,
          businessVertical: formData.businessVertical,
          tenantId: tenant.id,
        },
      });
    }

    // Actualizar el perfil de negocio en WhatsApp si está activo
    if (formData.isActive && formData.businessName) {
      try {
        const whatsapp = new WhatsappApiService({
          phoneNumberId: formData.phoneNumberId,
          accessToken: formData.accessToken,
        });

        await whatsapp.updateBusinessProfile({
          about: formData.businessDescription,
          email: formData.businessEmail,
          address: formData.businessAddress,
          description: formData.businessDescription,
          vertical: formData.businessVertical,
          websites: formData.businessWebsite
            ? [formData.businessWebsite]
            : undefined,
        });
      } catch (error) {
        console.error("Error actualizando perfil de negocio:", error);
        // Continuamos a pesar del error, ya que la configuración se guardó correctamente
      }
    }

    // Revalidar la ruta para refrescar los datos
    revalidatePath("/settings/whatsapp");

    return {
      success: true,
      data: result,
      message: "Configuración guardada correctamente",
    };
  } catch (error) {
    console.error("Error guardando configuración WhatsApp:", error);
    return {
      error: "Error al guardar la configuración de WhatsApp",
    };
  }
}

export async function testWhatsappConnection(
  formData: WhatsappConfigFormData
): Promise<WhatsappApiResponse> {
  try {
    if (!formData.phoneNumberId || !formData.accessToken) {
      return {
        success: false,
        error: "Se requiere Phone Number ID y Access Token",
      };
    }

    const whatsapp = new WhatsappApiService({
      phoneNumberId: formData.phoneNumberId,
      accessToken: formData.accessToken,
    });

    // Intentar obtener el perfil de negocio como prueba de conexión
    const profile = await whatsapp.getBusinessProfile();

    if (!profile) {
      return {
        success: false,
        error: "No se pudo obtener el perfil de negocio",
      };
    }

    return {
      success: true,
      message: "Conexión exitosa con la API de WhatsApp",
      data: profile,
    };
  } catch (error: any) {
    console.error("Error probando conexión WhatsApp:", error);

    // Extraer mensaje de error más descriptivo si está disponible
    let errorMessage = "Error al conectar con la API de WhatsApp";
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

export async function refreshTemplates(): Promise<WhatsappApiResponse> {
  try {
    const tenant = await getCurrentTenant();

    if (!tenant?.id) {
      return { error: "No se pudo determinar el tenant actual" };
    }

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
    revalidatePath("/settings/whatsapp");
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
