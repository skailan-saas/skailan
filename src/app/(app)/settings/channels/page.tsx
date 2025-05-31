
"use client";

import React, { useState, useEffect, type FormEvent, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Zap, PlusCircle, Settings, MessageSquare, Globe, Smartphone, MoreHorizontal, LinkIcon, Unlink, Pencil, Eye, Copy, Send } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChannelTypeDefinition {
  id: 'whatsapp' | 'messenger' | 'instagram' | 'webchat' | 'telegram' | 'api';
  name: string;
  description: string;
  icon: React.ElementType;
  usesWebhook: boolean;
  placeholderDetails?: string; // e.g., "Enter WhatsApp Number"
}

interface ConnectedChannelInstance {
  id: string;
  instanceName: string;
  channelTypeId: ChannelTypeDefinition['id'];
  status: 'connected' | 'disconnected' | 'needs_attention' | 'pending_webhook';
  webhookUrl?: string;
  verifyToken?: string;
  details?: string; // For storing things like Phone Number or Page ID
}

// Using actual Send icon from lucide-react
const SendIcon = Send; 

const CHANNEL_TYPE_CATALOG: ChannelTypeDefinition[] = [
  { id: 'whatsapp', name: 'WhatsApp Business API', description: 'Connect your official WhatsApp Business account.', icon: Smartphone, usesWebhook: true, placeholderDetails: "Enter WhatsApp Number (e.g., +15551234567)" },
  { id: 'messenger', name: 'Facebook Messenger', description: 'Integrate with your Facebook Page Messenger.', icon: MessageSquare, usesWebhook: true, placeholderDetails: "Enter Facebook Page ID" },
  { id: 'instagram', name: 'Instagram Direct', description: 'Manage Instagram Direct Messages.', icon: MessageSquare, usesWebhook: true, placeholderDetails: "Enter Instagram Handle" },
  { id: 'webchat', name: 'Website Chat Widget', description: 'Embed a chat widget on your website.', icon: Globe, usesWebhook: false, placeholderDetails: "Website Domain (e.g., example.com)" },
  { id: 'telegram', name: 'Telegram Bot', description: 'Connect your Telegram Bot.', icon: SendIcon , usesWebhook: false, placeholderDetails: "Enter Telegram Bot Token" },
  { id: 'api', name: 'Custom API Channel', description: 'Integrate via custom API.', icon: Zap, usesWebhook: true, placeholderDetails: "API Endpoint URL" },
];


const initialConnectedChannels: ConnectedChannelInstance[] = [
  {
    id: 'wh-1', instanceName: 'Sales WhatsApp', channelTypeId: 'whatsapp', status: 'connected',
    webhookUrl: 'https://example.com/webhooks/meta/wh-1', verifyToken: 'STRONG_TOKEN_WH1', details: '+15550001111'
  },
  {
    id: 'msgr-1', instanceName: 'Support Page Messenger', channelTypeId: 'messenger', status: 'pending_webhook',
    webhookUrl: 'https://example.com/webhooks/meta/msgr-1', verifyToken: 'STRONG_TOKEN_MSGR1', details: 'fb_page_id_123'
  },
  {
    id: 'web-1', instanceName: 'Main Website Chat', channelTypeId: 'webchat', status: 'connected', details: 'www.mybusiness.com'
  },
];

export default function ChannelConnectionsPage() {
  const { toast } = useToast();
  const [connectedChannels, setConnectedChannels] = useState<ConnectedChannelInstance[]>(initialConnectedChannels);

  const [isAddChannelDialogOpen, setIsAddChannelDialogOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newChannelDetails, setNewChannelDetails] = useState("");
  const [selectedChannelTypeIdToAdd, setSelectedChannelTypeIdToAdd] = useState<ChannelTypeDefinition['id'] | undefined>(undefined);

  const [isViewWebhookDialogOpen, setIsViewWebhookDialogOpen] = useState(false);
  const [channelToViewWebhook, setChannelToViewWebhook] = useState<ConnectedChannelInstance | null>(null);

  const [isEditChannelDialogOpen, setIsEditChannelDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ConnectedChannelInstance | null>(null);
  const [editInstanceName, setEditInstanceName] = useState("");
  const [editChannelDetails, setEditChannelDetails] = useState("");

  const [isManageChannelDialogOpen, setIsManageChannelDialogOpen] = useState(false);
  const [channelToManage, setChannelToManage] = useState<ConnectedChannelInstance | null>(null);

  const [isDisconnectConfirmOpen, setIsDisconnectConfirmOpen] = useState(false);
  const [channelToDisconnect, setChannelToDisconnect] = useState<ConnectedChannelInstance | null>(null);
  
  const selectedChannelTypeDefinition = useMemo(() => {
    return CHANNEL_TYPE_CATALOG.find(ct => ct.id === selectedChannelTypeIdToAdd);
  }, [selectedChannelTypeIdToAdd]);


  const handleAddChannelSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newInstanceName.trim() || !selectedChannelTypeIdToAdd) {
      toast({ title: "Error", description: "Please provide a name and select a channel type.", variant: "destructive" });
      return;
    }

    const channelType = CHANNEL_TYPE_CATALOG.find(ct => ct.id === selectedChannelTypeIdToAdd);
    if (!channelType) {
      toast({ title: "Error", description: "Invalid channel type selected.", variant: "destructive" });
      return;
    }

    const newId = `${selectedChannelTypeIdToAdd}-${Date.now()}`;
    let webhookUrl, verifyToken, status: ConnectedChannelInstance['status'] = 'disconnected';

    if (channelType.usesWebhook) {
      webhookUrl = `https://your-tenant.conectahub.app/webhooks/${channelType.id}/${newId}`;
      verifyToken = Math.random().toString(36).substring(2, 18).toUpperCase(); // Random token
      status = 'pending_webhook';
    }

    const newChannelInstance: ConnectedChannelInstance = {
      id: newId,
      instanceName: newInstanceName,
      channelTypeId: selectedChannelTypeIdToAdd,
      status,
      webhookUrl,
      verifyToken,
      details: newChannelDetails,
    };

    setConnectedChannels(prev => [newChannelInstance, ...prev]);
    toast({ title: "Channel Added", description: `${channelType.name} connection "${newInstanceName}" added.` });

    setNewInstanceName("");
    setNewChannelDetails("");
    setSelectedChannelTypeIdToAdd(undefined);
    setIsAddChannelDialogOpen(false);
  };

  const openEditDialog = (channel: ConnectedChannelInstance) => {
    setEditingChannel(channel);
    setEditInstanceName(channel.instanceName);
    setEditChannelDetails(channel.details || "");
    setIsEditChannelDialogOpen(true);
  };

  const handleEditChannelSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingChannel || !editInstanceName.trim()) {
         toast({ title: "Error", description: "Instance name cannot be empty.", variant: "destructive" });
        return;
    }
    setConnectedChannels(prev => prev.map(ch =>
      ch.id === editingChannel.id ? { ...ch, instanceName: editInstanceName, details: editChannelDetails } : ch
    ));
    toast({ title: "Channel Updated", description: `Connection "${editInstanceName}" updated.`});
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
    setConnectedChannels(prev => prev.filter(ch => ch.id !== channelToDisconnect.id));
    toast({ title: "Channel Disconnected", description: `Connection "${channelToDisconnect.instanceName}" removed.` });
    setIsDisconnectConfirmOpen(false);
    setChannelToDisconnect(null);
  };

  const handleSimulateConnect = (channelId: string) => {
    setConnectedChannels(prev => prev.map(ch =>
      ch.id === channelId ? { ...ch, status: ch.status === 'pending_webhook' && ch.webhookUrl ? 'pending_webhook' : 'connected' } : ch
    ));
    toast({ title: "Connection Action", description: `Channel status updated to 'connected' (simulated).` });
  };
  
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard", description: `${fieldName} copied successfully.` });
    } catch (err) {
      toast({ title: "Copy Failed", description: `Could not copy ${fieldName}.`, variant: "destructive" });
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
        <Dialog open={isAddChannelDialogOpen} onOpenChange={setIsAddChannelDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Channel Connection</DialogTitle>
              <DialogDescription>Configure a new instance for a communication channel.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddChannelSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="addChannelType">Channel Type</Label>
                <Select value={selectedChannelTypeIdToAdd} onValueChange={(value) => setSelectedChannelTypeIdToAdd(value as ChannelTypeDefinition['id'])}>
                  <SelectTrigger id="addChannelType"><SelectValue placeholder="Select channel type" /></SelectTrigger>
                  <SelectContent>
                    {CHANNEL_TYPE_CATALOG.map(ct => (
                      <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="addInstanceName">Instance Name</Label>
                <Input id="addInstanceName" placeholder="e.g., Sales WhatsApp Line" value={newInstanceName} onChange={e => setNewInstanceName(e.target.value)} required />
                <p className="text-xs text-muted-foreground mt-1">A friendly name to identify this specific connection.</p>
              </div>
              {selectedChannelTypeDefinition?.placeholderDetails && (
                <div>
                    <Label htmlFor="addChannelDetails">{selectedChannelTypeDefinition.name} Details</Label>
                    <Input id="addChannelDetails" placeholder={selectedChannelTypeDefinition.placeholderDetails} value={newChannelDetails} onChange={e => setNewChannelDetails(e.target.value)} />
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Connection</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {connectedChannels.length === 0 && (
        <Card className="text-center py-10">
            <CardHeader><CardTitle>No Channel Connections Yet</CardTitle></CardHeader>
            <CardContent>
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                <p className="text-muted-foreground">Start by adding your first channel connection using the button above.</p>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {connectedChannels.map((channelInstance) => {
          const typeInfo = CHANNEL_TYPE_CATALOG.find(ct => ct.id === channelInstance.channelTypeId);
          if (!typeInfo) return null;

          return (
            <Card key={channelInstance.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                  <typeInfo.icon className="h-5 w-5 text-primary" />
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{channelInstance.instanceName}</CardTitle>
                  <CardDescription className="text-xs mt-1">{typeInfo.name}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(channelInstance)}><Pencil className="mr-2 h-4 w-4" /> Edit Name/Details</DropdownMenuItem>
                    {typeInfo.usesWebhook && (
                      <DropdownMenuItem onClick={() => openViewWebhookDialog(channelInstance)}><Eye className="mr-2 h-4 w-4" /> View Webhook Info</DropdownMenuItem>
                    )}
                     <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => triggerDisconnectConfirmation(channelInstance)}>
                      <Unlink className="mr-2 h-4 w-4" /> Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="flex items-center text-sm">
                  {channelInstance.status === 'connected' && <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />}
                  {channelInstance.status === 'disconnected' && <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />}
                  {channelInstance.status === 'needs_attention' && <AlertCircle className="h-4 w-4 mr-2 text-yellow-500 flex-shrink-0" />}
                  {channelInstance.status === 'pending_webhook' && <Zap className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />}
                  <Badge variant={
                      channelInstance.status === 'connected' ? 'default' :
                      channelInstance.status === 'disconnected' ? 'secondary' :
                      channelInstance.status === 'pending_webhook' ? 'outline' : 
                      'destructive' // for needs_attention
                    }
                    className={
                        channelInstance.status === 'connected' ? 'bg-green-100 text-green-700 border-green-300' :
                        channelInstance.status === 'disconnected' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                        channelInstance.status === 'pending_webhook' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        'bg-yellow-100 text-yellow-700 border-yellow-300' // for needs_attention
                    }
                  >
                    {channelInstance.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
                {channelInstance.details && <p className="text-xs text-muted-foreground">Details: {channelInstance.details}</p>}
                 {channelInstance.status === 'pending_webhook' && (
                    <p className="text-xs text-blue-600">Webhook configuration pending. Click "View Webhook Info" and update your {typeInfo.name} settings.</p>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t">
                {(channelInstance.status === 'disconnected' || channelInstance.status === 'needs_attention') && (
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="sm" onClick={() => handleSimulateConnect(channelInstance.id)}>
                    <LinkIcon className="mr-2 h-4 w-4" /> Connect
                    </Button>
                )}
                {channelInstance.status === 'connected' && (
                    <Button variant="outline" className="w-full" size="sm" onClick={() => openManageDialog(channelInstance)}>
                    <Settings className="mr-2 h-4 w-4" /> Manage
                    </Button>
                )}
                 {channelInstance.status === 'pending_webhook' && (
                    <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50" size="sm" onClick={() => openViewWebhookDialog(channelInstance)}>
                        <Settings className="mr-2 h-4 w-4" /> View Webhook Setup
                    </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Manage Channel Dialog */}
      <Dialog open={isManageChannelDialogOpen} onOpenChange={setIsManageChannelDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Manage: {channelToManage?.instanceName}</DialogTitle>
                <DialogDescription>
                    Manage settings and view details for this {CHANNEL_TYPE_CATALOG.find(ct => ct.id === channelToManage?.channelTypeId)?.name} connection.
                </DialogDescription>
            </DialogHeader>
            {channelToManage && (
                <div className="space-y-4 py-4">
                    <div>
                        <Label className="text-sm font-medium">Instance Name</Label>
                        <p className="text-sm text-muted-foreground">{channelToManage.instanceName}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Channel Type</Label>
                        <p className="text-sm text-muted-foreground">{CHANNEL_TYPE_CATALOG.find(ct => ct.id === channelToManage.channelTypeId)?.name}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <p className="text-sm text-muted-foreground capitalize">{channelToManage.status.replace('_', ' ')}</p>
                    </div>
                    {channelToManage.details && (
                        <div>
                            <Label className="text-sm font-medium">{CHANNEL_TYPE_CATALOG.find(ct => ct.id === channelToManage.channelTypeId)?.name} Details</Label>
                            <p className="text-sm text-muted-foreground">{channelToManage.details}</p>
                        </div>
                    )}
                    <Separator />
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "Action Placeholder", description: "Refresh Connection logic to be implemented."})}>
                           <Zap className="mr-2 h-4 w-4"/> Refresh Connection
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "Action Placeholder", description: "View Activity Logs logic to be implemented."})}>
                           <Eye className="mr-2 h-4 w-4"/> View Activity Logs
                        </Button>
                        {CHANNEL_TYPE_CATALOG.find(ct => ct.id === channelToManage.channelTypeId)?.usesWebhook && (
                             <Button variant="outline" className="w-full justify-start" onClick={() => {setIsManageChannelDialogOpen(false); openViewWebhookDialog(channelToManage)}}>
                                <LinkIcon className="mr-2 h-4 w-4"/> View Webhook Info
                            </Button>
                        )}
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={() => setIsManageChannelDialogOpen(false)}>Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Webhook Info Dialog */}
      <Dialog open={isViewWebhookDialogOpen} onOpenChange={setIsViewWebhookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Information for "{channelToViewWebhook?.instanceName}"</DialogTitle>
            <DialogDescription>
              Use these details to configure the webhook in your {CHANNEL_TYPE_CATALOG.find(ct => ct.id === channelToViewWebhook?.channelTypeId)?.name} settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <div className="flex items-center gap-2">
                <Input id="webhookUrl" readOnly value={channelToViewWebhook?.webhookUrl || "N/A"} className="font-mono text-xs"/>
                <Button variant="outline" size="icon" onClick={() => channelToViewWebhook?.webhookUrl && copyToClipboard(channelToViewWebhook.webhookUrl, "Webhook URL")} disabled={!channelToViewWebhook?.webhookUrl}><Copy className="h-4 w-4"/></Button>
              </div>
               <p className="text-xs text-muted-foreground mt-1">This is the URL your provider will send events to.</p>
            </div>
            <div>
              <Label htmlFor="verifyToken">Verify Token</Label>
              <div className="flex items-center gap-2">
                <Input id="verifyToken" readOnly value={channelToViewWebhook?.verifyToken || "N/A"} className="font-mono text-xs"/>
                <Button variant="outline" size="icon" onClick={() => channelToViewWebhook?.verifyToken && copyToClipboard(channelToViewWebhook.verifyToken, "Verify Token")} disabled={!channelToViewWebhook?.verifyToken}><Copy className="h-4 w-4"/></Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Use this token to verify webhook requests from your provider.</p>
            </div>
            {channelToViewWebhook?.status === 'pending_webhook' && (
                <Button onClick={() => channelToViewWebhook && handleSimulateConnect(channelToViewWebhook.id)} className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4"/> Mark as Configured & Connect (Simulate)
                </Button>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Channel Dialog */}
      <Dialog open={isEditChannelDialogOpen} onOpenChange={setIsEditChannelDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle>Edit Connection: {editingChannel?.instanceName}</DialogTitle>
                <DialogDescription>Update the name and details for this channel connection.</DialogDescription>
            </DialogHeader>
            {editingChannel && (
                <form onSubmit={handleEditChannelSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="editInstanceNameInput">Instance Name</Label>
                        <Input id="editInstanceNameInput" value={editInstanceName} onChange={e => setEditInstanceName(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="editChannelDetailsInput">
                            {CHANNEL_TYPE_CATALOG.find(ct => ct.id === editingChannel.channelTypeId)?.name} Details
                        </Label>
                        <Input 
                            id="editChannelDetailsInput" 
                            value={editChannelDetails} 
                            onChange={e => setEditChannelDetails(e.target.value)} 
                            placeholder={CHANNEL_TYPE_CATALOG.find(ct => ct.id === editingChannel.channelTypeId)?.placeholderDetails || "Enter details"}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>


      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={isDisconnectConfirmOpen} onOpenChange={setIsDisconnectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to disconnect this channel?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the connection for "{channelToDisconnect?.instanceName}". You may need to reconfigure it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setChannelToDisconnect(null); setIsDisconnectConfirmOpen(false);}} type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisconnect} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    </ScrollArea>
  );
}

