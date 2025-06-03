import prisma from "@/lib/prisma";
import { WhatsappApiService } from "@/lib/whatsapp/whatsapp-api";

export interface FlowNode {
  id: string;
  type:
    | "text"
    | "image"
    | "buttons"
    | "carousel"
    | "userInput"
    | "condition"
    | "action";
  position: { x: number; y: number };
  data: {
    label: string;
    messageText?: string;
    imageUrl?: string;
    altText?: string;
    buttons?: Array<{ id: string; label: string; payload: string }>;
    carouselConfigText?: string;
    promptText?: string;
    variableName?: string;
    variable?: string;
    operator?: string;
    value?: string;
    actionType?: string;
    actionParams?: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface ConversationState {
  currentNodeId: string;
  variables: Record<string, any>;
  waitingForInput?: boolean;
  inputType?: string;
  variableName?: string;
  lastMessageId?: string;
  currentFlowId?: string;
}

export class FlowEngine {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async getWhatsappApi(): Promise<WhatsappApiService | null> {
    try {
      // Obtener configuración de WhatsApp para el tenant
      const channel = await prisma.channel.findFirst({
        where: {
          tenantId: this.tenantId,
          channelType: "WHATSAPP",
          isActive: true,
        },
      });

      if (!channel || !channel.accessToken || !channel.phoneNumberId) {
        console.error("WhatsApp configuration not found for tenant");
        return null;
      }

      return new WhatsappApiService({
        phoneNumberId: channel.phoneNumberId,
        accessToken: channel.accessToken,
      });
    } catch (error) {
      console.error("Error getting WhatsApp API:", error);
      return null;
    }
  }

  /**
   * Ejecuta un flujo para una conversación específica
   */
  async executeFlow(
    conversationId: string,
    flowId: string,
    triggerMessage?: string
  ): Promise<void> {
    try {
      // Obtener el flujo de la base de datos
      const flow = await prisma.chatbotFlow.findFirst({
        where: {
          id: flowId,
          tenantId: this.tenantId,
          status: "PUBLISHED",
        },
      });

      if (!flow) {
        console.error(`Flow ${flowId} not found or not published`);
        return;
      }

      // Obtener la conversación
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          tenantId: this.tenantId,
        },
        include: {
          lead: true,
        },
      });

      if (!conversation) {
        console.error(`Conversation ${conversationId} not found`);
        return;
      }

      const flowDefinition = flow.definition as unknown as FlowDefinition;

      // Inicializar o recuperar el estado de la conversación
      let state = this.getConversationState(conversation);

      // Si es la primera vez, empezar desde el nodo inicial
      if (!state.currentNodeId) {
        const startNode = flowDefinition.nodes.find(
          (node) =>
            !flowDefinition.edges.some((edge) => edge.target === node.id)
        );

        if (!startNode) {
          console.error("No start node found in flow");
          return;
        }

        state.currentNodeId = startNode.id;
        state.currentFlowId = flowId;
      }

      // Si hay un mensaje de trigger, procesarlo como input del usuario
      if (triggerMessage && state.waitingForInput) {
        await this.processUserInput(conversationId, triggerMessage, state);
      }

      // Ejecutar el nodo actual
      await this.executeNode(conversationId, flowDefinition, state);
    } catch (error) {
      console.error("Error executing flow:", error);
    }
  }

  /**
   * Procesa la entrada del usuario cuando el flujo está esperando input
   */
  private async processUserInput(
    conversationId: string,
    userInput: string,
    state: ConversationState
  ): Promise<void> {
    try {
      console.log(`Processing user input: "${userInput}" for state type: ${state.inputType}`);
      
      // Guardar la entrada del usuario en las variables
      if (state.inputType && state.variableName) {
        state.variables[state.variableName] = userInput;
      }
      
      // Si es una selección de botón o carrusel, también guardar en variables específicas
      if (state.inputType === "button" || state.inputType === "carousel_selection") {
        // Comprobar si ya tenemos datos de selección en las variables
        // Estos datos pueden haber sido añadidos por el procesamiento de webhook interactivo
        if (!state.variables.selected_option) {
          state.variables.selected_option = userInput;
        }
      }

      // Marcar que ya no estamos esperando input
      state.waitingForInput = false;
      state.inputType = undefined;

      // Actualizar el estado en la base de datos
      await this.saveConversationState(conversationId, state);
      
      console.log(`User input processed and saved to variables: ${JSON.stringify(state.variables)}`);
    } catch (error) {
      console.error("Error processing user input:", error);
      // Aún así, marcar que ya no estamos esperando input para evitar bloqueos
      state.waitingForInput = false;
      state.inputType = undefined;
      await this.saveConversationState(conversationId, state);
    }
  }

  /**
   * Ejecuta un nodo específico del flujo
   */
  private async executeNode(
    conversationId: string,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    const currentNode = flowDefinition.nodes.find(
      (node) => node.id === state.currentNodeId
    );

    if (!currentNode) {
      console.error(`Node ${state.currentNodeId} not found`);
      return;
    }

    console.log(`Executing node: ${currentNode.id} (${currentNode.type})`);

    switch (currentNode.type) {
      case "text":
        await this.executeTextNode(
          conversationId,
          currentNode,
          flowDefinition,
          state
        );
        break;

      case "image":
        await this.executeImageNode(
          conversationId,
          currentNode,
          flowDefinition,
          state
        );
        break;

      case "buttons":
        await this.executeButtonsNode(
          conversationId,
          currentNode,
          flowDefinition,
          state
        );
        break;

      case "carousel":
        await this.executeCarouselNode(
          conversationId,
          currentNode,
          flowDefinition,
          state
        );
        break;

      case "userInput":
        await this.executeUserInputNode(conversationId, currentNode, state);
        break;

      case "condition":
        await this.executeConditionNode(
          conversationId,
          currentNode,
          flowDefinition,
          state
        );
        break;

      case "action":
        await this.executeActionNode(
          conversationId,
          currentNode,
          flowDefinition,
          state
        );
        break;

      default:
        console.log(`Node type ${currentNode.type} not implemented yet`);
        await this.moveToNextNode(
          conversationId,
          currentNode.id,
          flowDefinition,
          state
        );
    }
  }

  /**
   * Ejecuta un nodo de texto
   */
  private async executeTextNode(
    conversationId: string,
    node: FlowNode,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    const messageText = this.replaceVariables(
      node.data.messageText || "",
      state.variables
    );

    // Enviar mensaje de texto
    await this.sendMessage(conversationId, messageText, "TEXT");

    // Mover al siguiente nodo
    await this.moveToNextNode(conversationId, node.id, flowDefinition, state);
  }

  /**
   * Ejecuta un nodo de imagen
   */
  private async executeImageNode(
    conversationId: string,
    node: FlowNode,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    const imageUrl = node.data.imageUrl;
    const altText = node.data.altText || "Image";

    if (imageUrl) {
      // Enviar mensaje de imagen
      await this.sendMessage(conversationId, altText, "IMAGE", { imageUrl });
    }

    // Mover al siguiente nodo
    await this.moveToNextNode(conversationId, node.id, flowDefinition, state);
  }

  /**
   * Ejecuta un nodo de botones
   */
  private async executeButtonsNode(
    conversationId: string,
    node: FlowNode,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    const messageText = this.replaceVariables(
      node.data.messageText || "",
      state.variables
    );
    const buttons = node.data.buttons || [];

    // Obtener la conversación para determinar el canal
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: this.tenantId },
      include: { lead: true },
    });

    if (!conversation || !conversation.channelSpecificId) {
      console.error("Conversation or channel ID not found");
      return;
    }

    // Enviar mensaje con botones según el canal
    if (conversation.channel === "WHATSAPP") {
      const whatsappApi = await this.getWhatsappApi();
      if (whatsappApi && conversation.channelSpecificId) {
        // Formatear botones para WhatsApp
        const formattedButtons = buttons.map(button => ({
          id: button.id,
          title: button.label.substring(0, 20) // WhatsApp tiene límite de 20 caracteres
        }));

        // Usar el nuevo método para enviar botones
        await whatsappApi.sendButtonsMessage(
          conversation.channelSpecificId,
          messageText,
          formattedButtons,
          node.data.label || "Selecciona una opción",
          "Powered by Skailan"
        );

        // Guardar el mensaje en la base de datos
        await prisma.message.create({
          data: {
            tenantId: this.tenantId,
            conversationId: conversationId,
            content: messageText,
            messageType: "INTERACTIVE",
            sender: "AGENT",
            metadata: { buttons },
          },
        });
        
        // Actualizar la conversación
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });
      }
    } else {
      // Para otros canales usar el método genérico
      await this.sendMessage(conversationId, messageText, "INTERACTIVE", {
        buttons,
      });
    }

    // Esperar respuesta del usuario (el webhook manejará la respuesta)
    state.waitingForInput = true;
    state.inputType = "button";
    await this.saveConversationState(conversationId, state);
  }

  /**
   * Ejecuta un nodo de entrada de usuario
   */
  private async executeUserInputNode(
    conversationId: string,
    node: FlowNode,
    state: ConversationState
  ): Promise<void> {
    const promptText = this.replaceVariables(
      node.data.promptText || "",
      state.variables
    );

    // Enviar prompt al usuario
    await this.sendMessage(conversationId, promptText, "TEXT");

    // Esperar respuesta del usuario
    state.waitingForInput = true;
    state.inputType = "text";
    state.variableName = node.data.variableName;
    await this.saveConversationState(conversationId, state);
  }

  /**
   * Ejecuta un nodo de condición
   */
  private async executeConditionNode(
    conversationId: string,
    node: FlowNode,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    const variable = node.data.variable || "";
    const operator = node.data.operator || "equals";
    const value = node.data.value || "";

    const variableValue = state.variables[variable];
    let conditionMet = false;

    switch (operator) {
      case "equals":
        conditionMet = variableValue === value;
        break;
      case "contains":
        conditionMet = String(variableValue)
          .toLowerCase()
          .includes(value.toLowerCase());
        break;
      case "greater_than":
        conditionMet = Number(variableValue) > Number(value);
        break;
      case "less_than":
        conditionMet = Number(variableValue) < Number(value);
        break;
      default:
        conditionMet = false;
    }

    // Buscar el siguiente nodo basado en la condición
    const edges = flowDefinition.edges.filter(
      (edge) => edge.source === node.id
    );
    let nextNodeId = null;

    if (conditionMet && edges.length > 0) {
      // Tomar el primer edge como "true"
      nextNodeId = edges[0].target;
    } else if (!conditionMet && edges.length > 1) {
      // Tomar el segundo edge como "false"
      nextNodeId = edges[1].target;
    }

    if (nextNodeId) {
      state.currentNodeId = nextNodeId;
      await this.saveConversationState(conversationId, state);
      await this.executeNode(conversationId, flowDefinition, state);
    }
  }

  /**
   * Ejecuta un nodo de acción
   */
  private async executeActionNode(
    conversationId: string,
    node: FlowNode,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    const actionType = node.data.actionType;
    const actionParams = node.data.actionParams;

    try {
      switch (actionType) {
        case "api_call":
          if (actionParams) {
            const params = JSON.parse(actionParams);
            // Realizar llamada API
            const response = await fetch(params.url, {
              method: params.method || "GET",
              headers: params.headers || {},
              body: params.body ? JSON.stringify(params.body) : undefined,
            });

            if (response.ok) {
              const data = await response.json();
              state.variables["api_response"] = data;
            }
          }
          break;

        case "set_variable":
          if (actionParams) {
            const params = JSON.parse(actionParams);
            state.variables[params.name] = params.value;
          }
          break;

        case "create_lead":
          // Crear un lead basado en las variables recopiladas
          await this.createLeadFromVariables(state.variables);
          break;

        default:
          console.log(`Action type ${actionType} not implemented`);
      }
    } catch (error) {
      console.error("Error executing action:", error);
    }

    // Mover al siguiente nodo
    await this.moveToNextNode(conversationId, node.id, flowDefinition, state);
  }

  /**
   * Ejecuta un nodo de carousel
   */
  private async executeCarouselNode(
    conversationId: string,
    node: FlowNode,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    try {
      // Parsear la configuración del carrusel
      let carouselItems = [];
      
      if (node.data.carouselConfigText) {
        try {
          carouselItems = JSON.parse(this.replaceVariables(
            node.data.carouselConfigText,
            state.variables
          ));
        } catch (error) {
          console.error("Error parsing carousel configuration:", error);
          carouselItems = [];
        }
      }

      if (!Array.isArray(carouselItems) || carouselItems.length === 0) {
        console.error("Invalid carousel configuration: must be a non-empty array");
        // Mover al siguiente nodo si la configuración es inválida
        await this.moveToNextNode(conversationId, node.id, flowDefinition, state);
        return;
      }

      // Obtener la conversación para determinar el canal
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: this.tenantId },
        include: { lead: true },
      });

      if (!conversation || !conversation.channelSpecificId) {
        console.error("Conversation or channel ID not found");
        return;
      }

      // Enviar mensaje de carrusel según el canal
      if (conversation.channel === "WHATSAPP") {
        const whatsappApi = await this.getWhatsappApi();
        if (whatsappApi && conversation.channelSpecificId) {
          // Para WhatsApp, enviar como secciones con lista interactiva
          // o como mensajes de producto con catálogo si está disponible
          const sections = this.formatCarouselForWhatsApp(carouselItems);
          
          // Enviar como lista interactiva
          await whatsappApi.sendInteractiveMessage(
            conversation.channelSpecificId,
            {
              type: "list",
              header: { type: "text", text: node.data.label || "Opciones disponibles" },
              body: { text: "Por favor selecciona una opción:" },
              footer: { text: "Powered by Skailan" },
              action: {
                button: "Ver opciones",
                sections: sections
              }
            }
          );
          
          // Guardar el mensaje en la base de datos
          await prisma.message.create({
            data: {
              tenantId: this.tenantId,
              conversationId: conversationId,
              content: "Carrusel enviado",
              messageType: "INTERACTIVE",
              sender: "AGENT",
              metadata: { carouselItems },
            },
          });
          
          // Actualizar la conversación
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
          });
        }
      } else {
        // Para otros canales, enviar como múltiples mensajes
        for (const item of carouselItems) {
          // Enviar título
          if (item.title) {
            await this.sendMessage(conversationId, item.title, "TEXT");
          }
          
          // Enviar imagen si existe
          if (item.imageUrl) {
            await this.sendMessage(
              conversationId, 
              item.title || "Imagen", 
              "IMAGE", 
              { imageUrl: item.imageUrl }
            );
          }
          
          // Enviar botones si existen
          if (item.buttons && Array.isArray(item.buttons) && item.buttons.length > 0) {
            await this.sendMessage(
              conversationId,
              "Opciones:",
              "INTERACTIVE",
              { buttons: item.buttons }
            );
          }
        }
      }

      // Esperar respuesta del usuario (el webhook manejará la respuesta)
      state.waitingForInput = true;
      state.inputType = "carousel_selection";
      await this.saveConversationState(conversationId, state);
    } catch (error) {
      console.error("Error executing carousel node:", error);
      // Mover al siguiente nodo incluso si hay error
      await this.moveToNextNode(conversationId, node.id, flowDefinition, state);
    }
  }

  /**
   * Formatea elementos de carrusel para WhatsApp API
   */
  private formatCarouselForWhatsApp(carouselItems: any[]): any[] {
    const sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description: string;
      }>;
    }> = [];
    
    // Agrupar los elementos por sección (máximo 10 elementos por sección en WhatsApp)
    const itemsChunks: any[][] = [];
    for (let i = 0; i < carouselItems.length; i += 10) {
      itemsChunks.push(carouselItems.slice(i, i + 10));
    }
    
    // Crear secciones para WhatsApp
    itemsChunks.forEach((chunk, index) => {
      const rows = chunk.map((item, itemIndex) => ({
        id: `item_${index}_${itemIndex}`,
        title: item.title || `Opción ${itemIndex + 1}`,
        description: item.description || ""
      }));
      
      sections.push({
        title: `Sección ${index + 1}`,
        rows: rows
      });
    });
    
    return sections;
  }

  /**
   * Mueve al siguiente nodo en el flujo
   */
  private async moveToNextNode(
    conversationId: string,
    currentNodeId: string,
    flowDefinition: FlowDefinition,
    state: ConversationState
  ): Promise<void> {
    const nextEdge = flowDefinition.edges.find(
      (edge) => edge.source === currentNodeId
    );

    if (nextEdge) {
      state.currentNodeId = nextEdge.target;
      await this.saveConversationState(conversationId, state);

      // Ejecutar el siguiente nodo
      await this.executeNode(conversationId, flowDefinition, state);
    } else {
      // Fin del flujo
      console.log("Flow execution completed");
      state.waitingForInput = false;
      await this.saveConversationState(conversationId, state);
    }
  }

  /**
   * Envía un mensaje a través del canal apropiado
   */
  private async sendMessage(
    conversationId: string,
    content: string,
    messageType: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Obtener la conversación para saber el canal
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: this.tenantId },
        include: { lead: true },
      });

      if (!conversation || !conversation.channelSpecificId) {
        console.error("Conversation or channel ID not found");
        return;
      }

      let whatsappMessageId = null;

      // Enviar según el canal
      if (conversation.channel === "WHATSAPP") {
        const whatsappApi = await this.getWhatsappApi();
        if (whatsappApi && conversation.channelSpecificId) {
          let result;

          if (messageType === "TEXT") {
            result = await whatsappApi.sendTextMessage(
              conversation.channelSpecificId,
              content
            );
          } else if (messageType === "IMAGE" && metadata?.imageUrl) {
            result = await whatsappApi.sendImageMessage(
              conversation.channelSpecificId,
              metadata.imageUrl,
              content
            );
          }

          whatsappMessageId = result?.messages?.[0]?.id;
        }
      }

      // Guardar el mensaje en la base de datos
      await prisma.message.create({
        data: {
          tenantId: this.tenantId,
          conversationId: conversationId,
          content: content,
          messageType: messageType as any,
          sender: "AGENT",
          whatsappMessageId: whatsappMessageId,
          metadata: metadata ? metadata : null,
        },
      });

      // Actualizar la conversación
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  /**
   * Obtiene el estado actual de la conversación
   */
  private getConversationState(conversation: any): ConversationState {
    if (conversation.flowState) {
      return conversation.flowState as ConversationState;
    }

    return {
      currentNodeId: "",
      variables: {},
      waitingForInput: false,
    };
  }

  /**
   * Guarda el estado de la conversación
   */
  private async saveConversationState(
    conversationId: string,
    state: ConversationState
  ): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { flowState: state as any },
    });
  }

  /**
   * Reemplaza variables en el texto
   */
  private replaceVariables(
    text: string,
    variables: Record<string, any>
  ): string {
    let result = text;

    Object.keys(variables).forEach((key) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(
        new RegExp(placeholder, "g"),
        String(variables[key])
      );
    });

    return result;
  }

  /**
   * Crea un lead basado en las variables recopiladas
   */
  private async createLeadFromVariables(
    variables: Record<string, any>
  ): Promise<void> {
    try {
      const leadData: any = {
        tenantId: this.tenantId,
        firstName: variables.firstName || variables.name || "Unknown",
        lastName: variables.lastName || "",
        email: variables.email,
        phone: variables.phone,
        source: "CHATBOT",
        status: "NEW",
      };

      await prisma.lead.create({ data: leadData });
      console.log("Lead created from chatbot flow");
    } catch (error) {
      console.error("Error creating lead:", error);
    }
  }

  /**
   * Busca y ejecuta flujos automáticos basados en triggers
   */
  static async findAndExecuteTriggeredFlows(
    tenantId: string,
    conversationId: string,
    message: string,
    trigger: "message_received" | "conversation_started" | "keyword_detected"
  ): Promise<void> {
    try {
      // Buscar flujos que coincidan con el trigger
      const flows = await prisma.chatbotFlow.findMany({
        where: {
          tenantId: tenantId,
          status: "PUBLISHED",
          triggerType: trigger,
        },
      });

      for (const flow of flows) {
        // Verificar si el trigger coincide
        let shouldExecute = false;

        switch (trigger) {
          case "conversation_started":
            shouldExecute = true;
            break;

          case "keyword_detected":
            const keywords = (flow.triggerKeywords as string[]) || [];
            shouldExecute = keywords.some((keyword: string) =>
              message.toLowerCase().includes(keyword.toLowerCase())
            );
            break;

          case "message_received":
            shouldExecute = true;
            break;
        }

        if (shouldExecute) {
          const engine = new FlowEngine(tenantId);
          await engine.executeFlow(conversationId, flow.id, message);
          break; // Solo ejecutar el primer flujo que coincida
        }
      }
    } catch (error) {
      console.error("Error finding and executing triggered flows:", error);
    }
  }
}
