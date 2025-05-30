
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Mail, MessageSquare, MoreVertical, Paperclip, Phone, SendHorizonal, Smile, Sparkles, UserCircle, Video, Star, Trash2, Archive as ArchiveIcon, XCircle, UserPlus, Inbox } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { summarizeConversation, suggestResponse } from "@/ai/flows";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

type ConversationStatus = "active" | "assigned" | "closed" | "archived";
type Channel = "whatsapp" | "messenger" | "instagram" | "web";

type Conversation = {
  id: string;
  userName: string;
  lastMessageSnippet: string;
  avatarUrl: string;
  dataAiHint?: string;
  unreadCount: number;
  timestamp: string;
  channel: Channel;
  tags?: string[];
  status: ConversationStatus;
  assignedAgentName?: string;
};

const initialConversations: Conversation[] = [
  { id: "1", userName: "Alice Wonderland", lastMessageSnippet: "Thanks for your help!", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "female avatar", unreadCount: 0, timestamp: "10:30 AM", channel: "whatsapp", tags: ["vip", "order_issue"], status: "closed", assignedAgentName: "Agent Smith" },
  { id: "2", userName: "Bob The Builder", lastMessageSnippet: "Can I get a quote for...", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "male avatar", unreadCount: 2, timestamp: "11:15 AM", channel: "messenger", status: "active" },
  { id: "3", userName: "Charlie Brown", lastMessageSnippet: "Is this item in stock?", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "person avatar", unreadCount: 0, timestamp: "09:00 AM", channel: "instagram", tags: ["new_lead"], status: "assigned", assignedAgentName: "Jane Doe" },
  { id: "4", userName: "Diana Prince", lastMessageSnippet: "My order hasn't arrived.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", unreadCount: 1, timestamp: "Yesterday", channel: "web", tags: ["urgent"], status: "active" },
  { id: "5", userName: "Edward Scissorhands", lastMessageSnippet: "Need help with pruning.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "goth man", unreadCount: 0, timestamp: "2 days ago", channel: "whatsapp", status: "archived" },
  { id: "6", userName: "Fiona Gallagher", lastMessageSnippet: "Issue with web login", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman red hair", unreadCount: 3, timestamp: "11:30 AM", channel: "web", status: "active" },
  { id: "7", userName: "Gomez Addams", lastMessageSnippet: "Enquiry about new features", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "man suit", unreadCount: 0, timestamp: "10:00 AM", channel: "messenger", status: "assigned", assignedAgentName: "Agent Smith" },
];

const initialMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1-1", sender: "user", content: "Hi, I have an issue with my recent order.", timestamp: "10:25 AM", type: "text" },
    { id: "m1-2", sender: "agent", content: "Hello Alice, I'm sorry to hear that. Can you please provide your order number?", timestamp: "10:26 AM", type: "text" },
    { id: "m1-3", sender: "user", content: "Sure, it's #12345.", timestamp: "10:27 AM", type: "text" },
    { id: "m1-4", sender: "agent", content: "Thanks for your help!", timestamp: "10:30 AM", type: "text" },
  ],
  "2": [
    { id: "m2-1", sender: "user", content: "Hello, I'd like to inquire about your services.", timestamp: "11:10 AM", type: "text" },
    { id: "m2-2", sender: "user", content: "Can I get a quote for building a website?", timestamp: "11:15 AM", type: "text" },
    { id: "m2-3", sender: "agent", content: "Hi Bob! We can certainly help with that. What kind of website are you looking for?", timestamp: "11:16 AM", type: "text" },
    { id: "m2-4", sender: "user", content: "An e-commerce site.", timestamp: "11:18 AM", type: "text" },
    {
      id: "m2-5",
      sender: "agent",
      content: "Great! We have several packages. Would you like to see some options?",
      timestamp: "11:20 AM",
      type: "interactive",
      buttons: [{label: "Yes, show options", payload: "show_options"}, {label: "No, tell me more", payload: "tell_more"}]
    },
  ],
   "3": [
    { id: "m3-1", sender: "user", content: "Is this item in stock?", timestamp: "09:00 AM", type: "text" },
    {
      id: "m3-2",
      sender: "agent",
      content: "Which item are you referring to? Here's our latest catalog:",
      timestamp: "09:01 AM",
      type: "product",
      productName: "Wireless Headphones",
      productDescription: "Noise-cancelling, 20hr battery.",
      productPrice: "$99.99",
      imageUrl: "https://placehold.co/300x200.png",
      dataAiHint: "headphones audio",
    },
  ],
  "4": [
     { id: "m4-1", sender: "user", content: "My order hasn't arrived.", timestamp: "Yesterday", type: "text" },
  ],
  "5": [
    { id: "m5-1", sender: "user", content: "Need help with pruning.", timestamp: "2 days ago", type: "text" },
    { id: "m5-2", sender: "agent", content: "Certainly, Edward. What seems to be the trouble with your topiary?", timestamp: "2 days ago", type: "text" },
  ],
  "6": [
    { id: "m6-1", sender: "user", content: "I can't log in to the website.", timestamp: "11:25 AM", type: "text" },
    { id: "m6-2", sender: "user", content: "It says invalid credentials but I'm sure they are correct.", timestamp: "11:26 AM", type: "text" },
    { id: "m6-3", sender: "agent", content: "Hi Fiona, let me help you with that. Could you try resetting your password?", timestamp: "11:30 AM", type: "text" },
  ],
  "7": [
    { id: "m7-1", sender: "user", content: "Hello, I was wondering about the new AI features advertised.", timestamp: "09:55 AM", type: "text" },
    { id: "m7-2", sender: "agent", content: "Good morning Gomez! Our new AI features include automated summarization and response suggestions. How can I help you explore them?", timestamp: "10:00 AM", type: "text" },
  ]
};

type StatusFilterOption = ConversationStatus | "all";
const CHANNELS: Channel[] = ["whatsapp", "messenger", "instagram", "web"];

export default function AgentWorkspacePage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversations.find(c => c.status !== 'archived')?.id || null
  );
  const [messages, setMessages] = useState<Message[]>(selectedConversationId ? initialMessages[selectedConversationId] : []);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterOption>("all");
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<Channel | "all">("all");
  const [contactDaysAgo, setContactDaysAgo] = useState<number | null>(null);

  useEffect(() => {
    if (selectedConversationId) {
      setMessages(initialMessages[selectedConversationId] || []);
      setConversations(prev => prev.map(c => c.id === selectedConversationId ? {...c, unreadCount: 0} : c));
      setContactDaysAgo(Math.floor(Math.random() * 5) + 1);
    } else {
      setMessages([]);
      setContactDaysAgo(null);
    }
  }, [selectedConversationId]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const displayedConversations = useMemo(() => {
    let filteredByStatus = conversations;

    if (activeStatusFilter === "all") {
      filteredByStatus = conversations.filter(c => c.status !== 'archived');
    } else if (activeStatusFilter === "archived") {
      filteredByStatus = conversations.filter(c => c.status === 'archived');
    } else {
      filteredByStatus = conversations.filter(c => c.status === activeStatusFilter);
    }

    if (selectedChannelFilter === "all") {
      return filteredByStatus;
    }
    return filteredByStatus.filter(c => c.channel === selectedChannelFilter);

  }, [conversations, activeStatusFilter, selectedChannelFilter]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !selectedConversationId) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      sender: "agent",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text",
    };
    setMessages(prev => [...prev, msg]);
    setConversations(prevConvs => prevConvs.map(conv =>
      conv.id === selectedConversationId ? { ...conv, lastMessageSnippet: newMessage, timestamp: msg.timestamp } : conv
    ));
    setNewMessage("");
  };

  const handleSuggestResponse = async () => {
    if (!selectedConversationId) return;
    setIsLoadingAi(true);
    try {
      const history = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
      const lastUserMessage = messages.filter(m => m.sender === 'user').pop()?.content || "";
      const response = await suggestResponse({ customerMessage: lastUserMessage, conversationHistory: history });
      setNewMessage(response.suggestedResponse);
    } catch (error) {
      console.error("Error suggesting response:", error);
      toast({ title: "AI Suggestion Failed", description: "Could not generate a response.", variant: "destructive"});
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSummarizeConversation = async () => {
    if (!selectedConversationId) return;
    setIsLoadingAi(true);
    try {
      const history = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
      const response = await summarizeConversation({ conversationHistory: history });
      toast({ title: "Conversation Summary", description: response.summary, duration: 10000 });
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      toast({ title: "AI Summary Failed", description: "Could not summarize the conversation.", variant: "destructive"});
    } finally {
      setIsLoadingAi(false);
    }
  };

  const updateConversationStatus = (id: string, status: ConversationStatus, agentName?: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === id) {
        const updatedConv = { ...conv, status };
        if (agentName !== undefined) {
          updatedConv.assignedAgentName = agentName || undefined;
        }
        return updatedConv;
      }
      return conv;
    }));
  };

  const handleAssignAction = () => {
    if (!selectedConversationId) return;
    const demoAgent = "Agent Demo";
    updateConversationStatus(selectedConversationId, "assigned", demoAgent);
    toast({ title: "Conversation Assigned", description: `Assigned to ${demoAgent}.` });
  };

  const handleCloseAction = () => {
    if (!selectedConversationId) return;
    updateConversationStatus(selectedConversationId, "closed");
    toast({ title: "Conversation Closed" });
  };

  const handleArchiveAction = () => {
    if (!selectedConversationId) return;
    const oldStatus = selectedConversation?.status;
    updateConversationStatus(selectedConversationId, "archived");
    toast({ title: "Conversation Archived" });
    const nextConv = conversations.find(c => c.id !== selectedConversationId && c.status !== 'archived');
    setSelectedConversationId(nextConv?.id || null);
    if (activeStatusFilter === oldStatus) {
        setActiveStatusFilter("all");
    }
  };

  const handleUnarchiveAction = () => {
    if (!selectedConversationId || selectedConversation?.status !== "archived") return;
    updateConversationStatus(selectedConversationId, "active", "");
    toast({ title: "Conversation Unarchived" });
    setActiveStatusFilter("all");
  };


  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col md:grid md:grid-cols-[300px_1fr_350px] bg-background">
        {/* Conversations List Panel */}
        <Card className="flex flex-col rounded-none border-0 md:border-r h-full">
          <CardHeader className="p-4 space-y-3">
            <Input placeholder="Search conversations..." className="rounded-full" />
            <Tabs value={activeStatusFilter} onValueChange={(value) => setActiveStatusFilter(value as StatusFilterOption)}>
              <TabsList className="grid w-full grid-cols-3 h-auto sm:grid-cols-5">
                <TabsTrigger value="all" className="text-xs px-1 sm:px-2">Todas</TabsTrigger>
                <TabsTrigger value="active" className="text-xs px-1 sm:px-2">Activas</TabsTrigger>
                <TabsTrigger value="assigned" className="text-xs px-1 sm:px-2">Asignadas</TabsTrigger>
                <TabsTrigger value="closed" className="text-xs px-1 sm:px-2">Cerradas</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs px-1 sm:px-2">Archivadas</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={selectedChannelFilter} onValueChange={(value) => setSelectedChannelFilter(value as Channel | "all")}>
              <SelectTrigger className="w-full sm:w-[180px] mt-1">
                <SelectValue placeholder="Filter by channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {CHANNELS.map(channel => (
                  <SelectItem key={channel} value={channel} className="capitalize">
                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {displayedConversations.length === 0 && (
                <div className="text-center text-muted-foreground p-4">
                  <Inbox className="mx-auto h-10 w-10 mb-2"/>
                  No conversations in this view.
                </div>
              )}
              {displayedConversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={selectedConversationId === conv.id ? "secondary" : "ghost"}
                  className="w-full h-auto justify-start p-3 text-left"
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <Avatar className="mr-3 h-10 w-10" data-ai-hint={conv.dataAiHint || "avatar person"}>
                    <AvatarImage src={conv.avatarUrl} alt={conv.userName} />
                    <AvatarFallback>{conv.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate">{conv.userName}</h3>
                      <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessageSnippet}</p>
                     <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                            {conv.channel}
                        </Badge>
                        {conv.status === "assigned" && conv.assignedAgentName && (
                            <Badge variant="outline" className="text-xs">Asignada a: {conv.assignedAgentName}</Badge>
                        )}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && conv.status !== "archived" && (
                    <Badge variant="default" className="ml-2 bg-primary text-primary-foreground">{conv.unreadCount}</Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat View Panel */}
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            <header className="flex items-center p-3 border-b gap-3">
              <Avatar data-ai-hint={selectedConversation.dataAiHint || "avatar person"}>
                <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.userName} />
                <AvatarFallback>{selectedConversation.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{selectedConversation.userName}</h2>
                <span className="text-xs text-muted-foreground capitalize">
                  {selectedConversation.channel} - {selectedConversation.status === "assigned" && selectedConversation.assignedAgentName ? `Asignada a ${selectedConversation.assignedAgentName}` : selectedConversation.status}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {selectedConversation.status !== "archived" && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleAssignAction}><UserPlus className="h-5 w-5" /></Button></TooltipTrigger>
                      <TooltipContent><p>Asignar Conversación</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleCloseAction}><XCircle className="h-5 w-5" /></Button></TooltipTrigger>
                      <TooltipContent><p>Cerrar Conversación</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleArchiveAction}><ArchiveIcon className="h-5 w-5" /></Button></TooltipTrigger>
                      <TooltipContent><p>Archivar Conversación</p></TooltipContent>
                    </Tooltip>
                  </>
                )}
                 {selectedConversation.status === "archived" && (
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleUnarchiveAction}><ArchiveIcon className="h-5 w-5 text-green-600" /></Button></TooltipTrigger>
                      <TooltipContent><p>Desarchivar Conversación</p></TooltipContent>
                    </Tooltip>
                 )}
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button></TooltipTrigger>
                  <TooltipContent><p>Start Call</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button></TooltipTrigger>
                  <TooltipContent><p>Start Video Call</p></TooltipContent>
                </Tooltip>
              </div>
            </header>
            <ScrollArea className="flex-1 p-4 space-y-4 bg-muted/20">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl ${msg.sender === "agent" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border rounded-bl-none"}`}>
                    {msg.type === "text" && <p className="text-sm">{msg.content}</p>}
                    {msg.type === "image" && msg.imageUrl && (
                      <Image src={msg.imageUrl} alt="Sent image" width={200} height={150} className="rounded-md" data-ai-hint={msg.dataAiHint || "chat image"} />
                    )}
                    {msg.type === "product" && (
                      <div className="space-y-1">
                        {msg.imageUrl && <Image src={msg.imageUrl} alt={msg.productName || "Product"} width={150} height={100} className="rounded" data-ai-hint={msg.dataAiHint || "product image"} />}
                        <p className="font-semibold">{msg.productName}</p>
                        {msg.productDescription && <p className="text-xs">{msg.productDescription}</p>}
                        <p className="font-bold">{msg.productPrice}</p>
                      </div>
                    )}
                    {msg.type === "interactive" && msg.buttons && (
                       <div className="mt-1">
                        {msg.content && <p className="text-sm mb-2">{msg.content}</p>}
                        <div className="flex flex-col gap-2 pt-1">
                          {msg.buttons.map(btn => (
                            <Button
                              key={btn.payload}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left px-3 py-2 h-auto rounded-md",
                                msg.sender === "agent"
                                  ? "bg-white text-primary border-primary/50 hover:bg-primary/10"
                                  : "bg-muted/50 hover:bg-muted"
                              )}
                              onClick={() => console.log("Button clicked:", btn.payload)}
                            >
                              {btn.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${msg.sender === "agent" ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"}`}>{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
            {selectedConversation.status !== "closed" && selectedConversation.status !== "archived" && (
            <footer className="p-4 border-t bg-background">
              <div className="relative">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                  className="pr-28 resize-none"
                  rows={1}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button></TooltipTrigger>
                    <TooltipContent><p>Emoji</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button></TooltipTrigger>
                    <TooltipContent><p>Attach File</p></TooltipContent>
                  </Tooltip>
                  <Button size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full w-8 h-8" onClick={handleSendMessage} disabled={isLoadingAi}>
                    <SendHorizonal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSuggestResponse} disabled={isLoadingAi}>
                  <Sparkles className="mr-2 h-4 w-4" /> Suggest Reply {isLoadingAi && "(Loading...)"}
                </Button>
                 <Button variant="outline" size="sm" onClick={handleSummarizeConversation} disabled={isLoadingAi}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Summarize {isLoadingAi && "(Loading...)"}
                </Button>
              </div>
            </footer>
            )}
             {(selectedConversation.status === "closed" || selectedConversation.status === "archived") && (
                <footer className="p-4 border-t bg-background text-center">
                    <p className="text-sm text-muted-foreground">
                        This conversation is {selectedConversation.status}.
                        {selectedConversation.status === "archived" ? " You can unarchive it to continue." : " No further actions can be taken."}
                    </p>
                </footer>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 p-4">
            <Inbox className="h-16 w-16 mb-4 text-gray-400"/>
            <p className="text-lg">Select a conversation to start chatting.</p>
            <p className="text-sm text-gray-500">Or use the filters above to find specific conversations.</p>
          </div>
        )}

        {/* Lead Info Panel */}
        <Card className="hidden md:flex flex-col rounded-none border-0 md:border-l h-full">
        {selectedConversation ? (
          <>
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-3">
               <Avatar className="h-16 w-16" data-ai-hint={selectedConversation.dataAiHint || "avatar person"}>
                <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.userName}/>
                <AvatarFallback className="text-2xl">{selectedConversation.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{selectedConversation.userName}</CardTitle>
                <span className="text-sm text-muted-foreground">Lead Score: 85 (Demo)</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto"><Edit2 className="h-5 w-5" /></Button>
            </div>
             <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={
                        selectedConversation.status === "closed" || selectedConversation.status === "archived" ? "destructive" :
                        selectedConversation.status === "assigned" ? "secondary" : "default"
                    } className={selectedConversation.status === "active" ? "bg-green-500 text-white" : ""}>
                        {selectedConversation.status.charAt(0).toUpperCase() + selectedConversation.status.slice(1)}
                    </Badge>
                </div>
                {selectedConversation.assignedAgentName && selectedConversation.status === "assigned" && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Assigned to:</span>
                        <span>{selectedConversation.assignedAgentName}</span>
                    </div>
                )}
            </div>
             <div className="mt-2 flex flex-wrap gap-1">
                {selectedConversation.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-1">Contact Info</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-sky-500" /> {selectedConversation.userName.toLowerCase().replace(/\s+/g, ".")}@example.com</p>
                  <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-green-500" /> +1 (555) 123-4567</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm mb-1">Recent Activity (Demo)</h4>
                <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
                    <li>Viewed pricing page - 2 hours ago</li>
                    <li>Downloaded brochure - 1 day ago</li>
                     {contactDaysAgo !== null ? (
                      <li>First contact via {selectedConversation.channel} - {contactDaysAgo} {contactDaysAgo === 1 ? 'day' : 'days'} ago</li>
                    ) : (
                      <li>Loading contact history...</li>
                    )}
                </ul>
              </div>
               <Separator />
              <div>
                <h4 className="font-semibold text-sm mb-1">Products/Services of Interest (Demo)</h4>
                 <Badge variant="outline">Website Development</Badge>
                 <Badge variant="outline" className="ml-1">Chatbot Integration</Badge>
              </div>
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-4 border-t">
            <Button className="w-full">View Full CRM Profile</Button>
          </CardFooter>
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
             <UserCircle className="h-16 w-16 mb-4 text-gray-400"/>
            <p className="text-lg">Lead Information</p>
            <p className="text-sm text-gray-500">Select a conversation to see details about the contact.</p>
          </div>
        )}
        </Card>
      </div>
    </TooltipProvider>
  );
}


