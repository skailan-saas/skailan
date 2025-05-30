"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Zap, PlusCircle, Settings, MessageSquare, Globe, Smartphone, MoreHorizontal } from "lucide-react";
import Image from 'next/image'; 
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


// Define an interface for channel types
interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType | string; // Lucide icon component or path to an SVG/image
  iconType: 'lucide' | 'image';
  dataAiHint?: string; // For placeholder image hints
  status: 'connected' | 'disconnected' | 'needs_attention';
  manageLink?: string;
  connectLink?: string;
}

const channelsData: ChannelConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Connect your official WhatsApp Business account to manage conversations.',
    icon: Smartphone, 
    iconType: 'lucide',
    status: 'disconnected',
    connectLink: '#',
  },
  {
    id: 'messenger',
    name: 'Facebook Messenger',
    description: 'Integrate with your Facebook Page Messenger for customer interactions.',
    icon: MessageSquare, 
    iconType: 'lucide',
    status: 'connected',
    manageLink: '#',
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    description: 'Manage Instagram Direct Messages from your business profile.',
    icon: MessageSquare, 
    iconType: 'lucide',
    status: 'disconnected',
    connectLink: '#',
  },
  {
    id: 'webchat',
    name: 'Website Chat Widget',
    description: 'Embed a customizable chat widget directly on your website.',
    icon: Globe,
    iconType: 'lucide',
    status: 'connected',
    manageLink: '/settings/sdk',
  },
  {
    id: 'api',
    name: 'Custom API Channel',
    description: 'Integrate with other platforms or build custom solutions using our API.',
    icon: Zap,
    iconType: 'lucide',
    status: 'needs_attention',
    manageLink: '#',
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Connect your Telegram Bot to interact with users on Telegram.',
    icon: Smartphone, 
    iconType: 'lucide',
    status: 'disconnected',
    connectLink: '#',
  },
];

export default function ChannelConnectionsPage() {
  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Channel Connections</h1>
          <p className="text-muted-foreground">
            Manage your communication channels and integrate them with Conecta Hub.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Channel
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {channelsData.map((channel) => (
          <Card key={channel.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              {channel.iconType === 'lucide' && (
                <Avatar className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                  <channel.icon className="h-6 w-6 text-primary" />
                </Avatar>
              )}
              {channel.iconType === 'image' && typeof channel.icon === 'string' && (
                 <Avatar className="h-12 w-12 rounded-md">
                    <AvatarImage src={channel.icon as string} alt={`${channel.name} icon`} data-ai-hint={channel.dataAiHint || "channel logo"}/>
                    <AvatarFallback>{channel.name.substring(0,2).toUpperCase()}</AvatarFallback>
                 </Avatar>
              )}
              <div className="flex-1">
                <CardTitle className="text-lg">{channel.name}</CardTitle>
                <CardDescription className="text-xs mt-1 line-clamp-2">{channel.description}</CardDescription>
              </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-4 right-4">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                    {channel.status !== 'disconnected' && <DropdownMenuItem className="text-destructive focus:text-destructive">Disconnect</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Placeholder for specific channel config details or stats */}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 pt-4 border-t">
              <div className="flex items-center text-sm">
                {channel.status === 'connected' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                {channel.status === 'disconnected' && <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />}
                {channel.status === 'needs_attention' && <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />}
                <span className={`capitalize font-medium ${
                  channel.status === 'connected' ? 'text-green-600' : 
                  channel.status === 'needs_attention' ? 'text-yellow-600' : 'text-muted-foreground'
                }`}>
                  {channel.status.replace('_', ' ')}
                </span>
              </div>
              {channel.status === 'disconnected' && channel.connectLink && (
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                  <Zap className="mr-2 h-4 w-4" /> Connect {channel.name}
                </Button>
              )}
              {channel.status !== 'disconnected' && channel.manageLink && (
                <Button variant="outline" className="w-full" size="sm">
                  <Settings className="mr-2 h-4 w-4" /> Manage Settings
                </Button>
              )}
              {channel.status === 'needs_attention' && !channel.manageLink && (
                 <Button variant="outline" className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50" size="sm">
                  <Settings className="mr-2 h-4 w-4" /> Review Configuration
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
