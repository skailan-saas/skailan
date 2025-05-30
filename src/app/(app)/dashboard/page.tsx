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
import { Edit2, Mail, MessageSquare, MoreVertical, Paperclip, Phone, SendHorizonal, Smile, Sparkles, UserCircle, Video, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { summarizeConversation, suggestResponse } from "@/ai/flows"; 

type Message = {
  id: string;
  sender: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  type: "text" | "image" | "product" | "interactive";
  imageUrl?: string;
  productName?: string;
  productPrice?: string;
  productDescription?: string;
  buttons?: { label: string; payload: string }[];
  listItems?: { title: string; description?: string; payload: string }[];
};

type Conversation = {
  id: string;
  userName: string;
  lastMessageSnippet: string;
  avatarUrl: string;
  dataAiHint?: string; // Added for placeholder images
  unreadCount: number;
  timestamp: string;
  channel: "whatsapp" | "messenger" | "instagram" | "web";
  tags?: string[];
};

const initialConversations: Conversation[] = [
  { id: "1", userName: "Alice Wonderland", lastMessageSnippet: "Thanks for your help!", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "female avatar", unreadCount: 0, timestamp: "10:30 AM", channel: "whatsapp", tags: ["vip", "order_issue"] },
  { id: "2", userName: "Bob The Builder", lastMessageSnippet: "Can I get a quote for...", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "male avatar", unreadCount: 2, timestamp: "11:15 AM", channel: "messenger" },
  { id: "3", userName: "Charlie Brown", lastMessageSnippet: "Is this item in stock?", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "person avatar", unreadCount: 0, timestamp: "09:00 AM", channel: "instagram", tags: ["new_lead"] },
  { id: "4", userName: "Diana Prince", lastMessageSnippet: "My order hasn't arrived.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", unreadCount: 1, timestamp: "Yesterday", channel: "web", tags: ["urgent"] },
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
    },
  ],
  "4": [
     { id: "m4-1", sender: "user", content: "My order hasn't arrived.", timestamp: "Yesterday", type: "text" },
  ]
};


export default function AgentWorkspacePage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversations[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>(selectedConversationId ? initialMessages[selectedConversationId] : []);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    if (selectedConversationId) {
      setMessages(initialMessages[selectedConversationId] || []);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

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
    setNewMessage("");
    // Here you would also send the message to the backend
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
      // Show toast notification
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
      // Display summary, e.g., in a toast or a dedicated section in lead info
      alert(`Summary: ${response.summary}`); // Placeholder
    } catch (error) {
      console.error("Error summarizing conversation:", error);
    } finally {
      setIsLoadingAi(false);
    }
  };


  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col md:grid md:grid-cols-[300px_1fr_350px] bg-background"> {/* Adjusted for header height */}
        {/* Conversations List Panel */}
        <Card className="flex flex-col rounded-none border-0 md:border-r h-full">
          <CardHeader className="p-4">
            <Input placeholder="Search conversations..." className="rounded-full" />
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={selectedConversationId === conv.id ? "secondary" : "ghost"}
                  className="w-full h-auto justify-start p-3 text-left"
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <Avatar className="mr-3 h-10 w-10">
                    <AvatarImage src={conv.avatarUrl} alt={conv.userName} data-ai-hint={conv.dataAiHint || "avatar person"}/>
                    <AvatarFallback>{conv.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate">{conv.userName}</h3>
                      <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessageSnippet}</p>
                  </div>
                  {conv.unreadCount > 0 && (
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
            <header className="flex items-center p-4 border-b gap-3">
              <Avatar>
                <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.userName} data-ai-hint={selectedConversation.dataAiHint || "avatar person"}/>
                <AvatarFallback>{selectedConversation.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{selectedConversation.userName}</h2>
                <span className="text-xs text-muted-foreground capitalize">{selectedConversation.channel}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button></TooltipTrigger>
                  <TooltipContent><p>Start Call</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button></TooltipTrigger>
                  <TooltipContent><p>Start Video Call</p></TooltipContent>
                </Tooltip>
                <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
              </div>
            </header>
            <ScrollArea className="flex-1 p-4 space-y-4 bg-muted/20">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl ${msg.sender === "agent" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border rounded-bl-none"}`}>
                    {msg.type === "text" && <p className="text-sm">{msg.content}</p>}
                    {msg.type === "image" && msg.imageUrl && (
                      <Image src={msg.imageUrl} alt="Sent image" width={200} height={150} className="rounded-md" data-ai-hint="chat image" />
                    )}
                    {msg.type === "product" && (
                      <div className="space-y-1">
                        {msg.imageUrl && <Image src={msg.imageUrl} alt={msg.productName || "Product"} width={150} height={100} className="rounded" data-ai-hint="product image"/>}
                        <p className="font-semibold">{msg.productName}</p>
                        {msg.productDescription && <p className="text-xs">{msg.productDescription}</p>}
                        <p className="font-bold">{msg.productPrice}</p>
                      </div>
                    )}
                     {msg.type === "interactive" && msg.buttons && (
                      <div className="space-y-2 mt-2">
                        {msg.content && <p className="text-sm mb-2">{msg.content}</p>}
                        {msg.buttons.map(btn => (
                          <Button key={btn.payload} variant="outline" size="sm" className="w-full bg-card hover:bg-accent/20">
                            {btn.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${msg.sender === "agent" ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"}`}>{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
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
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a conversation to start chatting.</p>
          </div>
        )}

        {/* Lead Info Panel */}
        <Card className="hidden md:flex flex-col rounded-none border-0 md:border-l h-full">
        {selectedConversation ? (
          <>
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-3">
               <Avatar className="h-16 w-16">
                <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.userName} data-ai-hint={selectedConversation.dataAiHint || "avatar person"}/>
                <AvatarFallback className="text-2xl">{selectedConversation.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{selectedConversation.userName}</CardTitle>
                <span className="text-sm text-muted-foreground">Lead Score: 85</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto"><Edit2 className="h-5 w-5" /></Button>
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
                  <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-sky-500" /> {selectedConversation.userName.toLowerCase().replace(" ", ".")}@example.com</p>
                  <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-green-500" /> +1 (555) 123-4567</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm mb-1">Recent Activity</h4>
                <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
                    <li>Viewed pricing page - 2 hours ago</li>
                    <li>Downloaded brochure - 1 day ago</li>
                    <li>First contact via Web Chat - 3 days ago</li>
                </ul>
              </div>
               <Separator />
              <div>
                <h4 className="font-semibold text-sm mb-1">Products/Services of Interest</h4>
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
           <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
            <p>Select a conversation to see lead details.</p>
          </div>
        )}
        </Card>
      </div>
    </TooltipProvider>
  );
}
