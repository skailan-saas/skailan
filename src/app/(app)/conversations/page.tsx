"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit2,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  SendHorizonal,
  Smile,
  Sparkles,
  UserCircle,
  Video,
  Archive as ArchiveIcon,
  XCircle,
  UserPlus,
  Inbox,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, type FC } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  updateConversationStatus,
  type ConversationFE,
  type MessageFE,
} from "@/app/(app)/dashboard/actions";

type MessageType = "text" | "image" | "product" | "interactive";
type MessageSender = "user" | "agent" | "system";

type Message = {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  type: MessageType;
  imageUrl?: string;
  productName?: string;
  productPrice?: string;
  productDescription?: string;
  buttons?: { label: string; payload: string }[];
  listItems?: { title: string; description?: string; payload: string }[];
  dataAiHint?: string;
};

type Channel = "whatsapp" | "email" | "sms" | "telegram";
type ConversationStatus = "active" | "archived" | "closed";

type Conversation = {
  id: string;
  userName: string;
  lastMessageSnippet: string;
  avatarUrl: string;
  unreadCount: number;
  timestamp: string;
  channel: Channel;
  status: ConversationStatus;
  assignedAgentName?: string;
  leadId?: string;
  leadEmail?: string;
};

type StatusFilterOption = {
  label: string;
  value: StatusFilterOptionValue;
  count: number;
};

type StatusFilterOptionValue =
  | "all_active"
  | "unassigned"
  | "assigned_to_me"
  | "archived"
  | "closed";

const statusFilterOptions: StatusFilterOption[] = [
  { label: "Todas Activas", value: "all_active", count: 12 },
  { label: "Sin Asignar", value: "unassigned", count: 5 },
  { label: "Asignadas a Mí", value: "assigned_to_me", count: 7 },
  { label: "Archivadas", value: "archived", count: 3 },
  { label: "Cerradas", value: "closed", count: 2 },
];

const channelOptions: { label: string; value: Channel | "all" }[] = [
  { label: "Todos los Canales", value: "all" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "Telegram", value: "telegram" },
];

const getChannelIcon = (channel: Channel) => {
  switch (channel) {
    case "whatsapp":
      return "💬";
    case "email":
      return "📧";
    case "sms":
      return "📱";
    case "telegram":
      return "✈️";
    default:
      return "💬";
  }
};

const getChannelColor = (channel: Channel) => {
  switch (channel) {
    case "whatsapp":
      return "bg-green-100 text-green-800";
    case "email":
      return "bg-blue-100 text-blue-800";
    case "sms":
      return "bg-purple-100 text-purple-800";
    case "telegram":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Función para convertir MessageFE a Message
function convertMessageFEToMessage(msgFE: MessageFE): Message {
  return {
    id: msgFE.id,
    sender: msgFE.sender === "agent" ? "agent" : "user",
    content: msgFE.content,
    timestamp: new Date(msgFE.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type: msgFE.messageType === "image" ? "image" : "text",
    imageUrl: msgFE.imageUrl,
  };
}

// Función para convertir ConversationFE a Conversation
function convertConversationFEToConversation(
  convFE: ConversationFE
): Conversation {
  return {
    id: convFE.id,
    userName: convFE.leadName || "Usuario Desconocido",
    lastMessageSnippet: "Última actividad",
    avatarUrl: "",
    unreadCount: convFE.unreadCount,
    timestamp: convFE.lastMessageAt
      ? new Date(convFE.lastMessageAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    channel: (convFE.channel as Channel) || "whatsapp",
    status: (convFE.status as ConversationStatus) || "active",
    assignedAgentName: convFE.assignedAgentName,
    leadId: convFE.leadId,
    leadEmail: convFE.leadEmail,
  };
}

export default function ConversationsPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilterOptionValue>("all_active");
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<
    Channel | "all"
  >("all");
  const [contactDaysAgo, setContactDaysAgo] = useState<number | null>(null);

  // Cargar conversaciones al montar el componente
  useEffect(() => {
    loadConversations();
  }, []);

  // Cargar mensajes cuando cambia la conversación seleccionada
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
      markAsRead(selectedConversationId);
      setContactDaysAgo(Math.floor(Math.random() * 5) + 1);
    } else {
      setMessages([]);
      setContactDaysAgo(null);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const conversationsFE = await getConversations();
      const convertedConversations = conversationsFE.map(
        convertConversationFEToConversation
      );
      setConversations(convertedConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const messagesFE = await getConversationMessages(conversationId);
      const convertedMessages = messagesFE.map(convertMessageFEToMessage);
      setMessages(convertedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await markConversationAsRead(conversationId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: "agent",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      await sendMessage(selectedConversationId, newMessage);

      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado exitosamente",
      });

      // Recargar mensajes para obtener el mensaje real con ID correcto
      setTimeout(() => {
        loadMessages(selectedConversationId);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });

      // Remover el mensaje temporal en caso de error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await updateConversationStatus(conversationId, "ARCHIVED");
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, status: "archived" } : conv
        )
      );
      toast({
        title: "Conversación archivada",
        description: "La conversación ha sido archivada exitosamente",
      });
    } catch (error) {
      console.error("Error archiving conversation:", error);
      toast({
        title: "Error",
        description: "No se pudo archivar la conversación",
        variant: "destructive",
      });
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    try {
      await updateConversationStatus(conversationId, "CLOSED");
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, status: "closed" } : conv
        )
      );
      toast({
        title: "Conversación cerrada",
        description: "La conversación ha sido cerrada exitosamente",
      });
    } catch (error) {
      console.error("Error closing conversation:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la conversación",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const statusMatch =
        activeStatusFilter === "all_active"
          ? conversation.status === "active"
          : activeStatusFilter === "unassigned"
          ? !conversation.assignedAgentName
          : activeStatusFilter === "assigned_to_me"
          ? conversation.assignedAgentName === "Demo User"
          : conversation.status === activeStatusFilter;

      const channelMatch =
        selectedChannelFilter === "all" ||
        conversation.channel === selectedChannelFilter;

      return statusMatch && channelMatch;
    });
  }, [conversations, activeStatusFilter, selectedChannelFilter]);

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de conversaciones */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversaciones</h2>
            <Button size="sm" variant="outline">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative mb-4">
            <Input placeholder="Buscar conversaciones..." className="pl-8" />
            <MessageSquare className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Filtros de estado */}
          <div className="space-y-2 mb-4">
            {statusFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={
                  activeStatusFilter === option.value ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-between"
                onClick={() => setActiveStatusFilter(option.value)}
              >
                <span>{option.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Filtro de canal */}
          <Select
            value={selectedChannelFilter}
            onValueChange={(value) =>
              setSelectedChannelFilter(value as Channel | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por canal" />
            </SelectTrigger>
            <SelectContent>
              {channelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de conversaciones */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={cn(
                  "mb-2 cursor-pointer transition-colors hover:bg-accent",
                  selectedConversationId === conversation.id &&
                    "bg-accent border-primary"
                )}
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatarUrl} />
                      <AvatarFallback>
                        {conversation.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">
                          {conversation.userName}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">
                            {conversation.timestamp}
                          </span>
                          <span className="text-lg">
                            {getChannelIcon(conversation.channel)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {conversation.lastMessageSnippet}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            getChannelColor(conversation.channel)
                          )}
                        >
                          {conversation.channel}
                        </Badge>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <div className="border-b p-4 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.avatarUrl} />
                    <AvatarFallback>
                      {selectedConversation.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.userName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {contactDaysAgo && `Contacto hace ${contactDaysAgo} días`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Llamar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Videollamada</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleArchiveConversation(selectedConversation.id)
                          }
                        >
                          <ArchiveIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Archivar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCloseConversation(selectedConversation.id)
                          }
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cerrar conversación</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Área de mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === "agent"
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-3 py-2 rounded-lg",
                        message.sender === "agent"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.type === "image" && message.imageUrl && (
                        <Image
                          src={message.imageUrl}
                          alt="Imagen del mensaje"
                          width={200}
                          height={200}
                          className="rounded mb-2"
                        />
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.sender === "agent"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Área de entrada de mensaje */}
            <div className="border-t p-4 bg-card">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Escribe tu mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px] resize-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-muted-foreground">
                Elige una conversación de la lista para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral de información del contacto */}
      {selectedConversation && (
        <div className="w-80 border-l bg-card p-4">
          <div className="space-y-6">
            {/* Información del contacto */}
            <div>
              <h4 className="font-semibold mb-3">Información del Contacto</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedConversation.userName}
                  </span>
                </div>
                {selectedConversation.leadEmail && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedConversation.leadEmail}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Badge
                    variant="secondary"
                    className={getChannelColor(selectedConversation.channel)}
                  >
                    {selectedConversation.channel}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Estado de la conversación */}
            <div>
              <h4 className="font-semibold mb-3">Estado</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge
                    variant={
                      selectedConversation.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedConversation.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Asignado a:
                  </span>
                  <span className="text-sm">
                    {selectedConversation.assignedAgentName || "Sin asignar"}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Acciones rápidas */}
            <div>
              <h4 className="font-semibold mb-3">Acciones Rápidas</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar contacto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Inbox className="h-4 w-4 mr-2" />
                  Ver historial completo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    handleArchiveConversation(selectedConversation.id)
                  }
                >
                  <ArchiveIcon className="h-4 w-4 mr-2" />
                  Archivar conversación
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
