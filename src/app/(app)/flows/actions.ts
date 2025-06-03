"use server";

import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { FlowEngine, type FlowDefinition } from "@/lib/flows/flow-engine";
import { revalidatePath } from "next/cache";

export interface FlowFE {
  id: string;
  name: string;
  description: string | null;
  definition: FlowDefinition;
  status: string;
  version: number;
  triggerType: string | null;
  triggerKeywords: string[] | null;
  lastPublishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Obtiene todos los flujos del tenant
 */
export async function getFlows(): Promise<FlowFE[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const flows = await prisma.chatbotFlow.findMany({
      where: {
        tenantId: tenantId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return flows.map((flow: any) => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      definition: flow.definition as unknown as FlowDefinition,
      status: flow.status,
      version: flow.version,
      triggerType: flow.triggerType || null,
      triggerKeywords: flow.triggerKeywords
        ? (flow.triggerKeywords as string[])
        : null,
      lastPublishedAt: flow.lastPublishedAt,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    }));
  } catch (error) {
    console.error("Error getting flows:", error);
    throw new Error("Failed to get flows");
  }
}

/**
 * Obtiene un flujo específico por ID
 */
export async function getFlow(flowId: string): Promise<FlowFE | null> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const flow = await prisma.chatbotFlow.findFirst({
      where: {
        id: flowId,
        tenantId: tenantId,
        deletedAt: null,
      },
    });

    if (!flow) {
      return null;
    }

    return {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      definition: flow.definition as unknown as FlowDefinition,
      status: flow.status,
      version: flow.version,
      triggerType: (flow as any).triggerType || null,
      triggerKeywords: (flow as any).triggerKeywords
        ? ((flow as any).triggerKeywords as string[])
        : null,
      lastPublishedAt: flow.lastPublishedAt,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    };
  } catch (error) {
    console.error("Error getting flow:", error);
    throw new Error("Failed to get flow");
  }
}

/**
 * Crea un nuevo flujo
 */
export async function createFlow(data: {
  name: string;
  description?: string;
  definition: FlowDefinition;
  triggerType?: string;
  triggerKeywords?: string[];
}): Promise<FlowFE> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const createData: any = {
      tenantId: tenantId,
      name: data.name,
      description: data.description,
      definition: data.definition,
      status: "DRAFT",
      version: 1,
    };

    if (data.triggerType) {
      createData.triggerType = data.triggerType;
    }

    if (data.triggerKeywords) {
      createData.triggerKeywords = data.triggerKeywords;
    }

    const flow = await prisma.chatbotFlow.create({
      data: createData,
    });

    revalidatePath("/flows");

    return {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      definition: flow.definition as unknown as FlowDefinition,
      status: flow.status,
      version: flow.version,
      triggerType: (flow as any).triggerType || null,
      triggerKeywords: (flow as any).triggerKeywords
        ? ((flow as any).triggerKeywords as string[])
        : null,
      lastPublishedAt: flow.lastPublishedAt,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    };
  } catch (error) {
    console.error("Error creating flow:", error);
    throw new Error("Failed to create flow");
  }
}

/**
 * Actualiza un flujo existente
 */
export async function updateFlow(
  flowId: string,
  data: {
    name?: string;
    description?: string;
    definition?: FlowDefinition;
    triggerType?: string;
    triggerKeywords?: string[];
  }
): Promise<FlowFE> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.definition !== undefined) updateData.definition = data.definition;
    if (data.triggerType !== undefined)
      updateData.triggerType = data.triggerType;
    if (data.triggerKeywords !== undefined)
      updateData.triggerKeywords = data.triggerKeywords;

    // First verify the flow exists
    const existingFlow = await prisma.chatbotFlow.findUnique({
      where: {
        id: flowId,
        tenantId: tenantId,
      },
    });

    if (!existingFlow) {
      throw new Error(`Flow with ID ${flowId} not found for current tenant`);
    }

    const flow = await prisma.chatbotFlow.update({
      where: {
        id: flowId,
        tenantId: tenantId,
      },
      data: updateData,
    });

    revalidatePath("/flows");

    return {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      definition: flow.definition as unknown as FlowDefinition,
      status: flow.status,
      version: flow.version,
      triggerType: (flow as any).triggerType || null,
      triggerKeywords: (flow as any).triggerKeywords
        ? ((flow as any).triggerKeywords as string[])
        : null,
      lastPublishedAt: flow.lastPublishedAt,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    };
  } catch (error) {
    console.error("Error updating flow:", error);
    throw new Error("Failed to update flow");
  }
}

/**
 * Publica un flujo (lo hace disponible para ejecución)
 */
export async function publishFlow(flowId: string): Promise<FlowFE> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const flow = await prisma.chatbotFlow.update({
      where: {
        id: flowId,
        tenantId: tenantId,
      },
      data: {
        status: "PUBLISHED",
        lastPublishedAt: new Date(),
        version: {
          increment: 1,
        },
      },
    });

    revalidatePath("/flows");

    return {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      definition: flow.definition as unknown as FlowDefinition,
      status: flow.status,
      version: flow.version,
      triggerType: (flow as any).triggerType || null,
      triggerKeywords: (flow as any).triggerKeywords
        ? ((flow as any).triggerKeywords as string[])
        : null,
      lastPublishedAt: flow.lastPublishedAt,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    };
  } catch (error) {
    console.error("Error publishing flow:", error);
    throw new Error("Failed to publish flow");
  }
}

/**
 * Ejecuta un flujo manualmente para una conversación
 */
export async function executeFlowForConversation(
  flowId: string,
  conversationId: string,
  triggerMessage?: string
): Promise<void> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const engine = new FlowEngine(tenantId);
    await engine.executeFlow(conversationId, flowId, triggerMessage);
  } catch (error) {
    console.error("Error executing flow:", error);
    throw new Error("Failed to execute flow");
  }
}

/**
 * Obtiene las conversaciones activas para testing de flujos
 */
export async function getActiveConversations() {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId: tenantId,
        status: "ACTIVE",
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: 20,
    });

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title || `Conversation ${conv.id.slice(0, 8)}`,
      channel: conv.channel,
      channelSpecificId: conv.channelSpecificId,
      lastMessageAt: conv.lastMessageAt,
    }));
  } catch (error) {
    console.error("Error getting conversations:", error);
    throw new Error("Failed to get conversations");
  }
}

/**
 * Elimina un flujo (soft delete)
 */
export async function deleteFlow(flowId: string): Promise<void> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    await prisma.chatbotFlow.update({
      where: {
        id: flowId,
        tenantId: tenantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath("/flows");
  } catch (error) {
    console.error("Error deleting flow:", error);
    throw new Error("Failed to delete flow");
  }
}
