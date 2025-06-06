"use client";

import React, {
  useState,
  useEffect,
  type FormEvent,
  useMemo,
  useCallback,
} from "react";
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  updateChannelStatus,
} from "./actions";
import { ConversationChannel } from "@prisma/client";
import { ChannelStatus } from "./types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  AlertCircle,
  Zap,
  PlusCircle,
  Settings,
  MessageSquare,
  Globe,
  Smartphone,
  MoreHorizontal,
  LinkIcon,
  Unlink,
  Pencil,
  Eye,
  Copy,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChannelTypeDefinition {
  id: ConversationChannel;
  name: string;
  description: string;
  icon: React.ElementType;
  usesWebhook: boolean;
  placeholderDetails?: string;
}

interface ConnectedChannelInstance {
  id: string;
  tenantId: string;
  instanceName: string;
  channelType: ConversationChannel;
  status: ChannelStatus;
  webhookUrl: string | null;
  verifyToken: string | null;
  details: string | null;
  phoneNumberId: string | null;
  phoneNumber: string | null;
  wabaId: string | null;
  accessToken: string | null;
  pageId: string | null;
  appSecret: string | null;
  botToken: string | null;
  apiEndpoint: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const SendIcon = Send;

const CHANNEL_TYPE_CATALOG: ChannelTypeDefinition[] = [
  {
    id: "WHATSAPP" as ConversationChannel,
    name: "WhatsApp Business API",
    description: "Connect your official WhatsApp Business account.",
    icon: Smartphone,
    usesWebhook: true,
    placeholderDetails: "Specific fields will appear below.",
  },
  {
    id: "MESSENGER" as ConversationChannel,
    name: "Facebook Messenger",
    description: "Integrate with your Facebook Page Messenger.",
    icon: MessageSquare,
    usesWebhook: true,
    placeholderDetails: "Enter Facebook Page ID",
  },
  {
    id: "INSTAGRAM" as ConversationChannel,
    name: "Instagram Direct",
    description: "Manage Instagram Direct Messages.",
    icon: MessageSquare,
    usesWebhook: true,
    placeholderDetails: "Enter Instagram Handle",
  },
  {
    id: "WEBCHAT" as ConversationChannel,
    name: "Website Chat Widget",
    description: "Embed a chat widget on your website.",
    icon: Globe,
    usesWebhook: false,
    placeholderDetails: "Website Domain (e.g., example.com)",
  },
  {
    id: "TELEGRAM" as ConversationChannel,
    name: "Telegram Bot",
    description: "Connect your Telegram Bot.",
    icon: SendIcon,
    usesWebhook: false,
    placeholderDetails: "Enter Telegram Bot Token",
  },
  {
    id: "API" as ConversationChannel,
    name: "Custom API Channel",
    description: "Integrate via custom API.",
    icon: Zap,
    usesWebhook: true,
    placeholderDetails: "API Endpoint URL",
  },
];

// Removed static data - now loading from database

// Helper functions for WhatsApp details
const parseWhatsAppDetailsString = (
  detailsStr?: string
): Record<string, string> => {
  if (!detailsStr) return {};
  const result: Record<string, string> = {};
  detailsStr.split(",").forEach((part) => {
    const [key, ...valParts] = part.split(":");
    if (key && valParts.length > 0) {
      result[key.trim()] = valParts.join(":").trim();
    }
  });
  return result;
};

interface WhatsAppDetailsObject {
  whatsappPhoneNumberId: string;
  whatsappPhoneNumber: string;
  whatsappWabaId: string;
  whatsappJwtStatus: string;
}

const formatWhatsAppDetailsToString = (
  detailsObj: WhatsAppDetailsObject
): string => {
  return [
    `PhoneID: ${detailsObj.whatsappPhoneNumberId}`,
    `Number: ${detailsObj.whatsappPhoneNumber}`,
    `WABA_ID: ${detailsObj.whatsappWabaId}`,
    `JWT_Status: ${detailsObj.whatsappJwtStatus}`,
  ].join(", ");
};

export default function ChannelConnectionsPage() {
  const { toast } = useToast();
  const [connectedChannels, setConnectedChannels] = useState<
    ConnectedChannelInstance[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Load channels from database on component mount
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const result = await getChannels();
        if (result.success && result.data) {
          setConnectedChannels(result.data);
        } else {
          toast({
            title: "Error",
            description: "Error al cargar los canales",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading channels:", error);
        toast({
          title: "Error",
          description: "Error al cargar los canales",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [toast]);

  const [isAddChannelDialogOpen, setIsAddChannelDialogOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newChannelDetails, setNewChannelDetails] = useState("");
  const [selectedChannelTypeIdToAdd, setSelectedChannelTypeIdToAdd] = useState<
    ChannelTypeDefinition["id"] | undefined
  >(undefined);

  const [currentWhatsappPhoneNumberId, setCurrentWhatsappPhoneNumberId] =
    useState("");
  const [currentWhatsappPhoneNumber, setCurrentWhatsappPhoneNumber] =
    useState("");
  const [currentWhatsappWabaId, setCurrentWhatsappWabaId] = useState("");
  const [currentWhatsappJwtStatus, setCurrentWhatsappJwtStatus] = useState("");

  const [isViewWebhookDialogOpen, setIsViewWebhookDialogOpen] = useState(false);
  const [channelToViewWebhook, setChannelToViewWebhook] =
    useState<ConnectedChannelInstance | null>(null);

  const [isEditChannelDialogOpen, setIsEditChannelDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] =
    useState<ConnectedChannelInstance | null>(null);
  const [editInstanceName, setEditInstanceName] = useState("");
  const [editChannelDetails, setEditChannelDetails] = useState("");

  const [isManageChannelDialogOpen, setIsManageChannelDialogOpen] =
    useState(false);
  const [channelToManage, setChannelToManage] =
    useState<ConnectedChannelInstance | null>(null);

  const [isDisconnectConfirmOpen, setIsDisconnectConfirmOpen] = useState(false);
  const [channelToDisconnect, setChannelToDisconnect] =
    useState<ConnectedChannelInstance | null>(null);

  const selectedChannelTypeDefinition = useMemo(() => {
    return CHANNEL_TYPE_CATALOG.find(
      (ct) => ct.id === selectedChannelTypeIdToAdd
    );
  }, [selectedChannelTypeIdToAdd]);

  const editingChannelTypeDefinition = useMemo(() => {
    if (!editingChannel) return null;
    return CHANNEL_TYPE_CATALOG.find(
      (ct) => ct.id === editingChannel.channelType
    );
  }, [editingChannel]);

  const resetAddDialogFields = () => {
    setNewInstanceName("");
    setNewChannelDetails("");
    setSelectedChannelTypeIdToAdd(undefined);
    setCurrentWhatsappPhoneNumberId("");
    setCurrentWhatsappPhoneNumber("");
    setCurrentWhatsappWabaId("");
    setCurrentWhatsappJwtStatus("");
  };

  const handleAddChannelSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newInstanceName.trim() || !selectedChannelTypeIdToAdd) {
      toast({
        title: "Error",
        description:
          "Por favor proporciona un nombre y selecciona un tipo de canal.",
        variant: "destructive",
      });
      return;
    }

    const channelType = CHANNEL_TYPE_CATALOG.find(
      (ct) => ct.id === selectedChannelTypeIdToAdd
    );
    if (!channelType) {
      toast({
        title: "Error",
        description: "Tipo de canal inválido seleccionado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const channelData = {
        instanceName: newInstanceName,
        channelType: selectedChannelTypeIdToAdd,
        details: newChannelDetails,
        phoneNumberId: currentWhatsappPhoneNumberId || undefined,
        phoneNumber: currentWhatsappPhoneNumber || undefined,
        wabaId: currentWhatsappWabaId || undefined,
        accessToken: currentWhatsappJwtStatus || undefined,
      };

      // Validate WhatsApp specific fields
      if (channelType.id === "WHATSAPP") {
        if (
          !currentWhatsappPhoneNumberId.trim() ||
          !currentWhatsappPhoneNumber.trim() ||
          !currentWhatsappWabaId.trim() ||
          !currentWhatsappJwtStatus.trim()
        ) {
          toast({
            title: "Error",
            description:
              "Por favor completa todos los campos específicos de WhatsApp.",
            variant: "destructive",
          });
          return;
        }
      }

      const result = await createChannel(channelData);

      if (result.success && result.data) {
        setConnectedChannels((prev) => [result.data, ...prev]);
        toast({
          title: "Canal Agregado",
          description: `Conexión "${newInstanceName}" de ${channelType.name} agregada.`,
        });
        resetAddDialogFields();
        setIsAddChannelDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear el canal",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating channel:", error);
      toast({
        title: "Error",
        description: "Error al crear el canal",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (channel: ConnectedChannelInstance) => {
    setEditingChannel(channel);
    setEditInstanceName(channel.instanceName);
    if (channel.channelType === "WHATSAPP") {
      const waDetails = parseWhatsAppDetailsString(
        channel.details
      ) as Partial<WhatsAppDetailsObject>;
      setCurrentWhatsappPhoneNumberId(waDetails.whatsappPhoneNumberId || "");
      setCurrentWhatsappPhoneNumber(waDetails.whatsappPhoneNumber || "");
      setCurrentWhatsappWabaId(waDetails.whatsappWabaId || "");
      setCurrentWhatsappJwtStatus(waDetails.whatsappJwtStatus || "");
      setEditChannelDetails("");
    } else {
      setEditChannelDetails(channel.details || "");
      setCurrentWhatsappPhoneNumberId("");
      setCurrentWhatsappPhoneNumber("");
      setCurrentWhatsappWabaId("");
      setCurrentWhatsappJwtStatus("");
    }
    setIsEditChannelDialogOpen(true);
  };

  const handleEditChannelSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingChannel || !editInstanceName.trim()) {
      toast({
        title: "Error",
        description: "Instance name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    let finalDetails = editChannelDetails;
    if (editingChannel.channelType === "WHATSAPP") {
      if (
        !currentWhatsappPhoneNumberId.trim() ||
        !currentWhatsappPhoneNumber.trim() ||
        !currentWhatsappWabaId.trim() ||
        !currentWhatsappJwtStatus.trim()
      ) {
        toast({
          title: "Error",
          description:
            "Please fill all WhatsApp specific fields, including JWT Status.",
          variant: "destructive",
        });
        return;
      }
      finalDetails = formatWhatsAppDetailsToString({
        whatsappPhoneNumberId: currentWhatsappPhoneNumberId,
        whatsappPhoneNumber: currentWhatsappPhoneNumber,
        whatsappWabaId: currentWhatsappWabaId,
        whatsappJwtStatus: currentWhatsappJwtStatus,
      });
    }

    setConnectedChannels((prev) =>
      prev.map((ch) =>
        ch.id === editingChannel.id
          ? { ...ch, instanceName: editInstanceName, details: finalDetails }
          : ch
      )
    );
    toast({
      title: "Channel Updated",
      description: `Connection "${editInstanceName}" updated.`,
    });
    setIsEditChannelDialogOpen(false);
    setEditingChannel(null);
  };

  const openManageDialog = (channel: ConnectedChannelInstance) => {
    setChannelToManage(channel);
    setIsManageChannelDialogOpen(true);
  };

  const openViewWebhookDialog = (channel: ConnectedChannelInstance) => {
    setChannelToViewWebhook(channel);
    setIsViewWebhookDialogOpen(true);
  };

  const triggerDisconnectConfirmation = (channel: ConnectedChannelInstance) => {
    setChannelToDisconnect(channel);
    setIsDisconnectConfirmOpen(true);
  };

  const handleConfirmDisconnect = () => {
    if (!channelToDisconnect) return;
    setConnectedChannels((prev) =>
      prev.filter((ch) => ch.id !== channelToDisconnect.id)
    );
    toast({
      title: "Channel Disconnected",
      description: `Connection "${channelToDisconnect.instanceName}" removed.`,
    });
    setIsDisconnectConfirmOpen(false);
    setChannelToDisconnect(null);
  };

  const handleSimulateConnect = (channelId: string) => {
    setConnectedChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? {
              ...ch,
              status:
                ch.status === ChannelStatus.PENDING_WEBHOOK && ch.webhookUrl
                  ? ChannelStatus.PENDING_WEBHOOK
                  : ChannelStatus.CONNECTED,
            }
          : ch
      )
    );
    toast({
      title: "Connection Action",
      description: `Channel status updated to 'connected' (simulated).`,
    });
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: `${fieldName} copied successfully.`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: `Could not copy ${fieldName}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Channel Connections</h1>
            <p className="text-muted-foreground">
              Manage your communication channel instances.
            </p>
          </div>
          <Dialog
            open={isAddChannelDialogOpen}
            onOpenChange={(isOpen) => {
              setIsAddChannelDialogOpen(isOpen);
              if (!isOpen) resetAddDialogFields();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Channel Connection</DialogTitle>
                <DialogDescription>
                  Configure a new instance for a communication channel.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleAddChannelSubmit}
                className="space-y-4 py-4"
              >
                <div>
                  <Label htmlFor="addChannelType">Channel Type</Label>
                  <Select
                    value={selectedChannelTypeIdToAdd}
                    onValueChange={(value) =>
                      setSelectedChannelTypeIdToAdd(
                        value as ChannelTypeDefinition["id"]
                      )
                    }
                  >
                    <SelectTrigger id="addChannelType">
                      <SelectValue placeholder="Select channel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_TYPE_CATALOG.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id}>
                          {ct.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="addInstanceName">Instance Name</Label>
                  <Input
                    id="addInstanceName"
                    placeholder="e.g., Sales WhatsApp Line"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A friendly name to identify this specific connection.
                  </p>
                </div>

                {selectedChannelTypeIdToAdd === "WHATSAPP" ? (
                  <>
                    <div>
                      <Label htmlFor="addWhatsappPhoneNumberId">
                        Phone Number ID
                      </Label>
                      <Input
                        id="addWhatsappPhoneNumberId"
                        placeholder="e.g., 123456789012345"
                        value={currentWhatsappPhoneNumberId}
                        onChange={(e) =>
                          setCurrentWhatsappPhoneNumberId(e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addWhatsappPhoneNumber">
                        Phone Number
                      </Label>
                      <Input
                        id="addWhatsappPhoneNumber"
                        placeholder="e.g., +15551234567"
                        value={currentWhatsappPhoneNumber}
                        onChange={(e) =>
                          setCurrentWhatsappPhoneNumber(e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addWhatsappWabaId">
                        WABA ID (WhatsApp Business Account ID)
                      </Label>
                      <Input
                        id="addWhatsappWabaId"
                        placeholder="e.g., 987654321098765"
                        value={currentWhatsappWabaId}
                        onChange={(e) =>
                          setCurrentWhatsappWabaId(e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addWhatsappJwtStatus">JWT Status</Label>
                      <Input
                        id="addWhatsappJwtStatus"
                        placeholder="e.g., Configured / Bearer Token"
                        value={currentWhatsappJwtStatus}
                        onChange={(e) =>
                          setCurrentWhatsappJwtStatus(e.target.value)
                        }
                        required
                      />
                    </div>
                  </>
                ) : selectedChannelTypeDefinition?.placeholderDetails &&
                  selectedChannelTypeDefinition.id !== "WHATSAPP" ? (
                  <div>
                    <Label htmlFor="addChannelDetails">
                      {selectedChannelTypeDefinition.name} Details
                    </Label>
                    <Input
                      id="addChannelDetails"
                      placeholder={
                        selectedChannelTypeDefinition.placeholderDetails
                      }
                      value={newChannelDetails}
                      onChange={(e) => setNewChannelDetails(e.target.value)}
                    />
                  </div>
                ) : null}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Add Connection
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {connectedChannels.length === 0 && (
          <Card className="text-center py-10">
            <CardHeader>
              <CardTitle>No Channel Connections Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Start by adding your first channel connection using the button
                above.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connectedChannels.map((channelInstance) => {
            const typeInfo = CHANNEL_TYPE_CATALOG.find(
              (ct) => ct.id === channelInstance.channelType
            );
            if (!typeInfo) return null;
            const isWhatsApp = channelInstance.channelType === "WHATSAPP";
            const waDetails = isWhatsApp
              ? parseWhatsAppDetailsString(channelInstance.details)
              : {};

            return (
              <Card
                key={channelInstance.id}
                className="shadow-lg hover:shadow-xl transition-shadow flex flex-col"
              >
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <Avatar className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <typeInfo.icon className="h-5 w-5 text-primary" />
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {channelInstance.instanceName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {typeInfo.name}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openEditDialog(channelInstance)}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit Name/Details
                      </DropdownMenuItem>
                      {typeInfo.usesWebhook && (
                        <DropdownMenuItem
                          onClick={() => openViewWebhookDialog(channelInstance)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Webhook Info
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() =>
                          triggerDisconnectConfirmation(channelInstance)
                        }
                      >
                        <Unlink className="mr-2 h-4 w-4" /> Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <div className="flex items-center text-sm">
                    {channelInstance.status === ChannelStatus.CONNECTED && (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                    )}
                    {channelInstance.status === ChannelStatus.DISCONNECTED && (
                      <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    )}
                    {channelInstance.status ===
                      ChannelStatus.NEEDS_ATTENTION && (
                      <AlertCircle className="h-4 w-4 mr-2 text-yellow-500 flex-shrink-0" />
                    )}
                    {channelInstance.status ===
                      ChannelStatus.PENDING_WEBHOOK && (
                      <Zap className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                    )}
                    <Badge
                      variant={
                        channelInstance.status === ChannelStatus.CONNECTED
                          ? "default"
                          : channelInstance.status ===
                            ChannelStatus.DISCONNECTED
                          ? "secondary"
                          : channelInstance.status ===
                            ChannelStatus.PENDING_WEBHOOK
                          ? "outline"
                          : "destructive"
                      }
                      className={
                        channelInstance.status === ChannelStatus.CONNECTED
                          ? "bg-green-100 text-green-700 border-green-300"
                          : channelInstance.status ===
                            ChannelStatus.DISCONNECTED
                          ? "bg-gray-100 text-gray-700 border-gray-300"
                          : channelInstance.status ===
                            ChannelStatus.PENDING_WEBHOOK
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                      }
                    >
                      {channelInstance.status
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                  {isWhatsApp ? (
                    <>
                      {waDetails["Number"] && (
                        <p className="text-xs text-muted-foreground">
                          Phone: {waDetails["Number"]}
                        </p>
                      )}
                      {waDetails["PhoneID"] && (
                        <p className="text-xs text-muted-foreground">
                          Phone ID: {waDetails["PhoneID"]}
                        </p>
                      )}
                    </>
                  ) : channelInstance.details ? (
                    <p className="text-xs text-muted-foreground">
                      Details: {channelInstance.details}
                    </p>
                  ) : null}
                  {channelInstance.status === ChannelStatus.PENDING_WEBHOOK && (
                    <p className="text-xs text-blue-600">
                      Webhook configuration pending. Click "View Webhook Info"
                      and update your {typeInfo.name} settings.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  {(channelInstance.status === ChannelStatus.DISCONNECTED ||
                    channelInstance.status ===
                      ChannelStatus.NEEDS_ATTENTION) && (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                      onClick={() => handleSimulateConnect(channelInstance.id)}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" /> Connect
                    </Button>
                  )}
                  {channelInstance.status === ChannelStatus.CONNECTED && (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => openManageDialog(channelInstance)}
                    >
                      <Settings className="mr-2 h-4 w-4" /> Manage
                    </Button>
                  )}
                  {channelInstance.status === ChannelStatus.PENDING_WEBHOOK && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                      size="sm"
                      onClick={() => openViewWebhookDialog(channelInstance)}
                    >
                      <Settings className="mr-2 h-4 w-4" /> View Webhook Setup
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Manage Channel Dialog */}
        <Dialog
          open={isManageChannelDialogOpen}
          onOpenChange={setIsManageChannelDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage: {channelToManage?.instanceName}</DialogTitle>
              <DialogDescription>
                Manage settings and view details for this{" "}
                {
                  CHANNEL_TYPE_CATALOG.find(
                    (ct) => ct.id === channelToManage?.channelType
                  )?.name
                }{" "}
                connection.
              </DialogDescription>
            </DialogHeader>
            {channelToManage && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-medium">Instance Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {channelToManage.instanceName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Channel Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {
                      CHANNEL_TYPE_CATALOG.find(
                        (ct) => ct.id === channelToManage.channelType
                      )?.name
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {channelToManage.status.replace("_", " ")}
                  </p>
                </div>

                {channelToManage.channelType === "WHATSAPP" ? (
                  <>
                    <Separator />
                    <h4 className="text-sm font-semibold">WhatsApp Details:</h4>
                    {Object.entries(
                      parseWhatsAppDetailsString(channelToManage.details)
                    ).map(
                      ([key, value]) =>
                        value && (
                          <div key={key}>
                            <Label className="text-sm font-medium">
                              {key.replace(/_/g, " ")}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {value}
                            </p>
                          </div>
                        )
                    )}
                  </>
                ) : channelToManage.details ? (
                  <div>
                    <Label className="text-sm font-medium">
                      {
                        CHANNEL_TYPE_CATALOG.find(
                          (ct) => ct.id === channelToManage.channelType
                        )?.name
                      }{" "}
                      Details
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {channelToManage.details}
                    </p>
                  </div>
                ) : null}
                <Separator />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      toast({
                        title: "Action Placeholder",
                        description:
                          "Refresh Connection logic to be implemented.",
                      })
                    }
                  >
                    <Zap className="mr-2 h-4 w-4" /> Refresh Connection
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      toast({
                        title: "Action Placeholder",
                        description:
                          "View Activity Logs logic to be implemented.",
                      })
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" /> View Activity Logs
                  </Button>
                  {CHANNEL_TYPE_CATALOG.find(
                    (ct) => ct.id === channelToManage.channelType
                  )?.usesWebhook && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setIsManageChannelDialogOpen(false);
                        channelToManage &&
                          openViewWebhookDialog(channelToManage);
                      }}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" /> View Webhook Info
                    </Button>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setIsManageChannelDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Webhook Info Dialog */}
        <Dialog
          open={isViewWebhookDialogOpen}
          onOpenChange={setIsViewWebhookDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Webhook Information for "{channelToViewWebhook?.instanceName}"
              </DialogTitle>
              <DialogDescription>
                Use these details to configure the webhook in your{" "}
                {
                  CHANNEL_TYPE_CATALOG.find(
                    (ct) => ct.id === channelToViewWebhook?.channelType
                  )?.name
                }{" "}
                settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="webhookUrl"
                    readOnly
                    value={channelToViewWebhook?.webhookUrl || "N/A"}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      channelToViewWebhook?.webhookUrl &&
                      copyToClipboard(
                        channelToViewWebhook.webhookUrl,
                        "Webhook URL"
                      )
                    }
                    disabled={!channelToViewWebhook?.webhookUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This is the URL your provider will send events to.
                </p>
              </div>
              <div>
                <Label htmlFor="verifyToken">Verify Token</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="verifyToken"
                    readOnly
                    value={channelToViewWebhook?.verifyToken || "N/A"}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      channelToViewWebhook?.verifyToken &&
                      copyToClipboard(
                        channelToViewWebhook.verifyToken,
                        "Verify Token"
                      )
                    }
                    disabled={!channelToViewWebhook?.verifyToken}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use this token to verify webhook requests from your provider.
                </p>
              </div>
              {channelToViewWebhook?.status ===
                ChannelStatus.PENDING_WEBHOOK && (
                <Button
                  onClick={() =>
                    channelToViewWebhook &&
                    handleSimulateConnect(channelToViewWebhook.id)
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Configured &
                  Connect (Simulate)
                </Button>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Channel Dialog */}
        <Dialog
          open={isEditChannelDialogOpen}
          onOpenChange={(isOpen) => {
            setIsEditChannelDialogOpen(isOpen);
            if (!isOpen) setEditingChannel(null);
          }}
        >
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                Edit Connection: {editingChannel?.instanceName}
              </DialogTitle>
              <DialogDescription>
                Update the name and details for this channel connection.
              </DialogDescription>
            </DialogHeader>
            {editingChannel && (
              <form
                onSubmit={handleEditChannelSubmit}
                className="space-y-4 py-4"
              >
                <div>
                  <Label htmlFor="editInstanceNameInput">Instance Name</Label>
                  <Input
                    id="editInstanceNameInput"
                    value={editInstanceName}
                    onChange={(e) => setEditInstanceName(e.target.value)}
                    required
                  />
                </div>

                {editingChannel.channelType === "WHATSAPP" ? (
                  <>
                    <div>
                      <Label htmlFor="editWhatsappPhoneNumberId">
                        Phone Number ID
                      </Label>
                      <Input
                        id="editWhatsappPhoneNumberId"
                        value={currentWhatsappPhoneNumberId}
                        onChange={(e) =>
                          setCurrentWhatsappPhoneNumberId(e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editWhatsappPhoneNumber">
                        Phone Number
                      </Label>
                      <Input
                        id="editWhatsappPhoneNumber"
                        value={currentWhatsappPhoneNumber}
                        onChange={(e) =>
                          setCurrentWhatsappPhoneNumber(e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editWhatsappWabaId">WABA ID</Label>
                      <Input
                        id="editWhatsappWabaId"
                        value={currentWhatsappWabaId}
                        onChange={(e) =>
                          setCurrentWhatsappWabaId(e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editWhatsappJwtStatus">JWT Status</Label>
                      <Input
                        id="editWhatsappJwtStatus"
                        value={currentWhatsappJwtStatus}
                        onChange={(e) =>
                          setCurrentWhatsappJwtStatus(e.target.value)
                        }
                        required
                      />
                    </div>
                  </>
                ) : editingChannelTypeDefinition?.placeholderDetails &&
                  editingChannelTypeDefinition.id !== "WHATSAPP" ? (
                  <div>
                    <Label htmlFor="editChannelDetailsInput">
                      {editingChannelTypeDefinition.name} Details
                    </Label>
                    <Input
                      id="editChannelDetailsInput"
                      value={editChannelDetails}
                      onChange={(e) => setEditChannelDetails(e.target.value)}
                      placeholder={
                        editingChannelTypeDefinition.placeholderDetails
                      }
                    />
                  </div>
                ) : null}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Disconnect Confirmation Dialog */}
        <AlertDialog
          open={isDisconnectConfirmOpen}
          onOpenChange={setIsDisconnectConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to disconnect this channel?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove the connection for "
                {channelToDisconnect?.instanceName}". You may need to
                reconfigure it later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setChannelToDisconnect(null);
                  setIsDisconnectConfirmOpen(false);
                }}
                type="button"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDisconnect}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
}
