
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, ChevronDown, ChevronRight, Edit3, MessageCircle, PlusCircle, Share2, Upload, Download, FileText, ToyBrick, HelpCircle, GitMerge } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Mock data for existing flows
const mockFlows = [
  { id: "1", name: "Welcome Flow", description: "Standard welcome message for new users.", lastModified: "2024-07-15" },
  { id: "2", name: "Support Request", description: "Handles incoming support queries.", lastModified: "2024-07-12" },
  { id: "3", name: "Sales Lead Capture", description: "Captures information from potential sales leads.", lastModified: "2024-07-10" },
];

// Mock node types
const nodeTypes = [
  { name: "Start", icon: ChevronRight, color: "bg-green-500/20 text-green-700 dark:text-green-400" },
  { name: "Send Message", icon: MessageCircle, color: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
  { name: "Ask Question", icon: HelpCircle, color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
  { name: "Condition (If/Else)", icon: GitMerge, color: "bg-purple-500/20 text-purple-700 dark:text-purple-400" },
  { name: "AI Action", icon: Bot, color: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400" },
  { name: "Set Variable", icon: Edit3, color: "bg-gray-500/20 text-gray-700 dark:text-gray-400" },
  { name: "Webhook", icon: Share2, color: "bg-teal-500/20 text-teal-700 dark:text-teal-400" },
  { name: "End Flow", icon: ChevronDown, color: "bg-red-500/20 text-red-700 dark:text-red-400" },
];

export default function FlowsPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-muted/30">
      <header className="flex items-center justify-between p-4 border-b bg-background shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Visual Flow Builder</h1>
          <p className="text-sm text-muted-foreground">Design and manage your conversational flows.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Flow</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Flow</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> New Flow</Button>
        </div>
      </header>
      
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] gap-0 overflow-hidden"> {/* Removed gap for seamless borders */}
        {/* Flows List Panel */}
        <Card className="flex flex-col rounded-none border-0 border-r h-full bg-background">
          <CardHeader className="p-3 border-b">
            <Input placeholder="Search flows..." />
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-2 space-y-1">
              {mockFlows.map(flow => (
                <Button
                  asChild 
                  variant="ghost"
                  key={flow.id}
                  className="w-full h-auto justify-start p-2 text-left flex items-start cursor-pointer"
                >
                  <div> {/* This div becomes the button due to asChild */}
                    <FileText className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <span className="font-medium block">{flow.name}</span>
                      <span className="text-xs text-muted-foreground block truncate">{flow.description}</span>
                      <span className="text-xs text-muted-foreground block">Modified: {flow.lastModified}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); /* Handle edit click */ }}
                      aria-label={`Edit flow ${flow.name}`}
                    >
                      <Edit3 className="h-4 w-4"/>
                    </Button>
                  </div>
                </Button>
              ))}
            </CardContent>
          </ScrollArea>
           <CardFooter className="p-2 border-t">
            <Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Create New Flow</Button>
          </CardFooter>
        </Card>

        {/* Flow Canvas Panel */}
        <div className="flex flex-col items-center justify-center bg-background border-r h-full p-4 relative overflow-auto">
           <div className="absolute top-4 left-4 z-10">
            <span className="text-lg font-semibold">Editing: Welcome Flow</span>
          </div>
          <ToyBrick className="h-32 w-32 text-muted-foreground/50 mb-4" />
          <h2 className="text-3xl font-semibold text-muted-foreground">Flow Canvas</h2>
          <p className="text-muted-foreground mt-2">Drag nodes from the palette to build your flow.</p>
          <p className="text-sm text-muted-foreground mt-1">(Visual editor coming soon!)</p>
          <div className="mt-8 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center">
            <p className="font-mono text-muted-foreground">
              {`Start Node -> Get User Input -> If (Intent == "greeting") -> Send Welcome Message -> End`}
            </p>
          </div>
        </div>

        {/* Node Palette & Properties Panel */}
        <Card className="flex flex-col rounded-none border-0 h-full bg-background">
          <CardHeader className="p-3 border-b">
            <CardTitle className="text-lg">Node Palette</CardTitle>
            <CardDescription className="text-xs">Drag nodes to the canvas</CardDescription>
          </Header>
          <ScrollArea className="flex-1">
            <CardContent className="p-2 grid grid-cols-2 gap-2">
              {nodeTypes.map(node => (
                <div key={node.name} className={`p-2 border rounded-md ${node.color} flex items-center gap-2 cursor-grab hover:ring-2 ring-primary transition-all`}>
                  <node.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{node.name}</span>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
          <Separator />
          <CardHeader className="p-3 border-b">
            <CardTitle className="text-lg">Properties</CardTitle>
            <CardDescription className="text-xs">Configure selected node</CardDescription>
          </Header>
           <ScrollArea className="flex-1">
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground">Select a node on the canvas to see its properties.</p>
              {/* Example Properties Form */}
              <div className="mt-4 space-y-3 hidden">
                <Label htmlFor="nodeName">Node Name</Label>
                <Input id="nodeName" defaultValue="Send Welcome Message" />
                <Label htmlFor="messageText">Message Text</Label>
                <Textarea id="messageText" defaultValue="Hello! Welcome to our service. How can I help you today?" />
                <Button size="sm" className="w-full">Save Properties</Button>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
