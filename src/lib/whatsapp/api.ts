import { ChannelStatus } from "@/app/(app)/settings/channels/types";

export interface WhatsAppMessage {
  to: string;
  type: "text" | "template" | "image" | "document" | "audio" | "video";
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    link?: string;
    filename?: string;
    caption?: string;
  };
  audio?: {
    id?: string;
    link?: string;
  };
  video?: {
    id?: string;
    link?: string;
    caption?: string;
  };
}

export interface WhatsAppChannel {
  id: string;
  phoneNumberId: string;
  accessToken: string;
  status: ChannelStatus;
}

export class WhatsAppAPI {
  private baseUrl = "https://graph.facebook.com/v18.0";

  async sendMessage(
    channel: WhatsAppChannel,
    message: WhatsAppMessage
  ): Promise<any> {
    if (channel.status !== ChannelStatus.CONNECTED) {
      throw new Error("Canal de WhatsApp no está conectado");
    }

    const url = `${this.baseUrl}/${channel.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channel.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        ...message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("WhatsApp API Error:", error);
      throw new Error(
        `Error enviando mensaje: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  }

  async sendTextMessage(
    channel: WhatsAppChannel,
    to: string,
    text: string
  ): Promise<any> {
    return this.sendMessage(channel, {
      to,
      type: "text",
      text: { body: text },
    });
  }

  async sendTemplateMessage(
    channel: WhatsAppChannel,
    to: string,
    templateName: string,
    languageCode: string = "es",
    components?: any[]
  ): Promise<any> {
    return this.sendMessage(channel, {
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }

  async sendImageMessage(
    channel: WhatsAppChannel,
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<any> {
    return this.sendMessage(channel, {
      to,
      type: "image",
      image: {
        link: imageUrl,
        caption,
      },
    });
  }

  async sendDocumentMessage(
    channel: WhatsAppChannel,
    to: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<any> {
    return this.sendMessage(channel, {
      to,
      type: "document",
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    });
  }

  async getMediaUrl(
    channel: WhatsAppChannel,
    mediaId: string
  ): Promise<string> {
    const url = `${this.baseUrl}/${mediaId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${channel.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo URL del media: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  }

  async downloadMedia(
    channel: WhatsAppChannel,
    mediaUrl: string
  ): Promise<Buffer> {
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${channel.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error descargando media: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async verifyWebhook(
    verifyToken: string,
    challenge: string
  ): Promise<boolean> {
    // Esta función se usa en el endpoint del webhook
    // El token se verifica contra la base de datos
    return true;
  }

  async getBusinessProfile(channel: WhatsAppChannel): Promise<any> {
    const url = `${this.baseUrl}/${channel.phoneNumberId}/whatsapp_business_profile`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${channel.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Error obteniendo perfil de negocio: ${response.statusText}`
      );
    }

    return await response.json();
  }

  async updateBusinessProfile(
    channel: WhatsAppChannel,
    profile: {
      about?: string;
      address?: string;
      description?: string;
      email?: string;
      profile_picture_url?: string;
      websites?: string[];
      vertical?: string;
    }
  ): Promise<any> {
    const url = `${this.baseUrl}/${channel.phoneNumberId}/whatsapp_business_profile`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channel.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Error actualizando perfil: ${
          error.error?.message || response.statusText
        }`
      );
    }

    return await response.json();
  }

  async getTemplates(channel: WhatsAppChannel): Promise<any> {
    const url = `${this.baseUrl}/${channel.phoneNumberId}/message_templates`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${channel.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo templates: ${response.statusText}`);
    }

    return await response.json();
  }

  async testConnection(channel: WhatsAppChannel): Promise<boolean> {
    try {
      await this.getBusinessProfile(channel);
      return true;
    } catch (error) {
      console.error("Error testing WhatsApp connection:", error);
      return false;
    }
  }
}

export const whatsappAPI = new WhatsAppAPI();
