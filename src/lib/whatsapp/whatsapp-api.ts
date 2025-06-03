import axios from "axios";
import { NextResponse } from "next/server";

// Constantes para la API de WhatsApp
const WHATSAPP_API_VERSION = "v18.0";
const WHATSAPP_API_URL = "https://graph.facebook.com";

// Tipos de mensajes y respuestas
export interface WhatsappApiConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
}

export interface WhatsappTextMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface WhatsappTemplateMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: "header" | "body" | "button";
      parameters: Array<any>;
    }>;
  };
}

export interface WhatsappMediaMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "image" | "audio" | "document" | "video";
  [mediaType: string]: any;
}

export interface WhatsappBusinessProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  websites?: string[];
  vertical?: string;
}

export interface WhatsappMessageTemplate {
  name: string;
  status: string;
  category: string;
  language: string;
  components: any[];
  id?: string;
}

export class WhatsappApiService {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: WhatsappApiConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || WHATSAPP_API_VERSION;
    this.baseUrl = `${WHATSAPP_API_URL}/${this.apiVersion}`;
  }

  /**
   * Envía un mensaje de texto a un destinatario
   */
  async sendTextMessage(
    to: string,
    text: string,
    previewUrl = false
  ): Promise<any> {
    try {
      const message: WhatsappTextMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: previewUrl,
          body: text,
        },
      };

      return await this.sendMessage(message);
    } catch (error) {
      console.error("Error enviando mensaje de texto:", error);
      throw error;
    }
  }

  /**
   * Envía un mensaje de plantilla a un destinatario
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = "es",
    components: any[] = []
  ): Promise<any> {
    try {
      const message: WhatsappTemplateMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      };

      if (components && components.length > 0) {
        message.template.components = components;
      }

      return await this.sendMessage(message);
    } catch (error) {
      console.error("Error enviando mensaje de plantilla:", error);
      throw error;
    }
  }

  /**
   * Envía una imagen a un destinatario
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<any> {
    try {
      const message: WhatsappMediaMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image: {
          link: imageUrl,
          caption,
        },
      };

      return await this.sendMessage(message);
    } catch (error) {
      console.error("Error enviando imagen:", error);
      throw error;
    }
  }

  /**
   * Envía un documento a un destinatario
   */
  async sendDocumentMessage(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string
  ): Promise<any> {
    try {
      const message: WhatsappMediaMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          link: documentUrl,
          filename,
          caption,
        },
      };

      return await this.sendMessage(message);
    } catch (error) {
      console.error("Error enviando documento:", error);
      throw error;
    }
  }

  /**
   * Método genérico para enviar mensajes
   */
  private async sendMessage(message: any): Promise<any> {
    try {
      const response = await axios({
        method: "POST",
        url: `${this.baseUrl}/${this.phoneNumberId}/messages`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        data: message,
      });

      return response.data;
    } catch (error) {
      console.error("Error en la API de WhatsApp:", error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil de negocio de WhatsApp
   */
  async getBusinessProfile(): Promise<any> {
    try {
      const response = await axios({
        method: "GET",
        url: `${this.baseUrl}/${this.phoneNumberId}/whatsapp_business_profile`,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          fields: "about,address,description,email,websites,vertical",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error obteniendo perfil de negocio:", error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil de negocio de WhatsApp
   */
  async updateBusinessProfile(
    profileData: WhatsappBusinessProfile
  ): Promise<any> {
    try {
      const response = await axios({
        method: "PATCH",
        url: `${this.baseUrl}/${this.phoneNumberId}/whatsapp_business_profile`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        data: profileData,
      });

      return response.data;
    } catch (error) {
      console.error("Error actualizando perfil de negocio:", error);
      throw error;
    }
  }

  /**
   * Obtiene las plantillas de mensajes disponibles
   */
  async getMessageTemplates(): Promise<WhatsappMessageTemplate[]> {
    try {
      const response = await axios({
        method: "GET",
        url: `${this.baseUrl}/${this.phoneNumberId}/message_templates`,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          limit: 1000,
        },
      });

      if (response.data && response.data.data) {
        return response.data.data.map((template: any) => ({
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          components: template.components || [],
          id: template.id,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error obteniendo plantillas de mensajes:", error);
      throw error;
    }
  }

  /**
   * Marca un mensaje como leído
   */
  async markMessageAsRead(messageId: string): Promise<any> {
    try {
      const response = await axios({
        method: "POST",
        url: `${this.baseUrl}/${this.phoneNumberId}/messages`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error marcando mensaje como leído:", error);
      throw error;
    }
  }

  /**
   * Verifica el webhook de WhatsApp
   */
  static verifyWebhook(req: Request): NextResponse {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Validar que sea una solicitud de verificación de webhook
    if (mode && token && challenge) {
      if (mode === "subscribe") {
        // La verificación de webhook debe coincidir con el token configurado
        // Esto debería compararse con el token almacenado en la base de datos
        // Para esta implementación de ejemplo, permitimos cualquier token
        return NextResponse.json(parseInt(challenge), { status: 200 });
      } else {
        return NextResponse.json(
          { error: "Modo no compatible" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Parámetros inválidos" },
      { status: 400 }
    );
  }

  /**
   * Procesa los eventos del webhook de WhatsApp
   */
  static async processWebhook(req: Request): Promise<any> {
    try {
      const body = await req.json();

      // Verificar que sea un evento de WhatsApp
      if (body && body.object === "whatsapp_business_account") {
        // Procesar las entradas (puede haber múltiples)
        if (body.entry && body.entry.length > 0) {
          return body;
        }
      }

      return null;
    } catch (error) {
      console.error("Error procesando webhook:", error);
      throw error;
    }
  }
}

/**
 * Función de utilidad para marcar un mensaje de WhatsApp como leído
 */
export async function markWhatsappMessageAsRead(
  config: WhatsappApiConfig,
  messageId: string
): Promise<any> {
  const whatsappService = new WhatsappApiService(config);
  return await whatsappService.markMessageAsRead(messageId);
}
