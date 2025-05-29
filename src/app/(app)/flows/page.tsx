
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bot, ChevronDown, ChevronRight, Edit3, PlusCircle, ToyBrick, HelpCircle, GitMerge, Share2, Upload, Download, FileText, Trash2, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { generateFlowFromPrompt } from "@/ai/flows"; // Import type

// Dynamically import the AI function only on the client-side after mount
let generateFlowFn: typeof generateFlowFromPrompt | null = null;

// Mock data for existing flows
const mockFlows = [
  { id: "1", name: "Welcome Flow", description: "Greets new users and offers initial options.", lastModified: "2024-07-28", status: "Published", icon: Bot },
  { id: "2", name: "Sales Inquiry", description: "Handles product questions and lead generation.", lastModified: "2024-07-25", status: "Draft", icon: ToyBrick },
  { id: "3", name: "Support Request", description: "Guides users through troubleshooting steps.", lastModified: "2024-07-22", status: "Published", icon: HelpCircle },
  { id: "4", name: "Feedback Collection", description: "Gathers user feedback post-interaction.", lastModified: "2024-07-20", status: "Archived", icon: GitMerge },
];

// Mock data for node types
const nodeTypes = [
  { type: "text", label: "Send Message", icon: MessageCircle, description: "Sends a simple text message." },
  { type: "image", label: "Send Image", icon: FileText, description: "Sends an image." },
  { type: "buttons", label: "Buttons", icon: ChevronDown, description: "Sends a message with buttons." },
  { type: "carousel", label: "Carousel", icon: ChevronRight, description: "Sends a carousel of items." },
  { type: "userInput", label: "User Input", icon: Edit3, description: "Waits for user input." },
  { type: "condition", label: "Condition", icon: GitMerge, description: "Branches flow based on conditions." },
  { type: "action", label: "Action", icon: ToyBrick, description: "Performs an action (e.g., API call)." },
];

export default function FlowsPage() {
  const [flowPrompt, setFlowPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null);

  // Effect to load the AI function
  useState(() => {
    import('@/ai/flows').then(module => {
      generateFlowFn = module.generateFlowFromPrompt;
    }).catch(err => console.error("Failed to load AI module", err));
  });

  const handleGenerateFlow = async () => {    
    if (!flowPrompt.trim() || !generateFlowFn) return;
    setIsGenerating(true);
    setGeneratedConfig(null);
    try {
      const result = await generateFlowFn({ flowDescription: flowPrompt });
      setGeneratedConfig(result.flowConfiguration);
    } catch (error) {
      console.error("Error generating flow:", error);
      // TODO: Show toast notification
      setGeneratedConfig("Error generating flow. Please check console.");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-muted/30">
      <header className="flex items-center justify-between p-4 border-b bg-background shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Visual Flow Builder</h1>
          <p className="text-muted-foreground">Design and manage your conversational flows.</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Flow</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Flow Configuration</DialogTitle>
              </DialogHeader>
              <Textarea placeholder="Paste your flow JSON here..." rows={10} />
              <DialogFooter>
                <Button type="submit">Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Create New Flow</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Create New Flow</DialogTitle>
                <CardDescription>Describe the flow you want to create, and our AI will generate a starting configuration for you.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input 
                  placeholder="e.g., A flow to welcome new users and ask for their email."
                  value={flowPrompt}
                  onChange={(e) => setFlowPrompt(e.target.value)}
                  disabled={isGenerating}
                />
                {generatedConfig && (
                  <div className="space-y-2">
                    <Label htmlFor="flow-config">Generated Configuration:</Label>
                    <Textarea id="flow-config" readOnly value={generatedConfig} rows={10} className="font-mono text-xs"/>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleGenerateFlow} disabled={isGenerating || !flowPrompt.trim() || !generateFlowFn}>
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </Button>
                <DialogClose asChild>
                    <Button variant="outline" disabled={!generatedConfig}>Create & Edit</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main content area with sidebar and canvas */}
      <div className="flex-1 grid grid-cols-[300px_1fr] overflow-hidden">
        {/* Flows List / Templates Sidebar */}
        <Card className="rounded-none border-0 border-r flex flex-col">
          <CardHeader className="p-3 border-b">
            <Input placeholder="Search flows..." />
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-0">
              <div className="p-2 space-y-1">
                {mockFlows.map((flow) => (
                   <Button
                    key={flow.id}
                    variant="ghost"
                    className="w-full h-auto justify-start p-3 text-left flex items-start gap-3"
                    asChild 
                  >
                    <div>
                      <flow.icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-medium truncate">{flow.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{flow.description}</p>
                        <p className="text-xs text-muted-foreground">Last modified: {flow.lastModified} - <span className={flow.status === 'Published' ? 'text-green-600' : 'text-yellow-600'}>{flow.status}</span></p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 self-center" onClick={(e) => {e.stopPropagation(); console.log("Edit flow", flow.id)}}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-2 border-t">
            <Button variant="outline" className="w-full text-sm"><FileText className="mr-2 h-4 w-4" /> Browse Templates</Button>
          </CardFooter>
        </Card>

        {/* Flow Canvas Area */}
        <div className="bg-muted/50 flex-1 overflow-auto p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-xl font-semibold">Welcome Flow</h2>
                <p className="text-sm text-muted-foreground">Status: Published - Last Saved: 2 mins ago</p>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline"><Download className="mr-2 h-4 w-4"/> Export</Button>
                 <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/> Share</Button>
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4"/> Save & Publish</Button>
                 <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete Flow</Button>
            </div>
          </div>
          {/* Placeholder for the actual canvas */}
          <div className="w-full h-[calc(100%-60px)] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <ToyBrick className="h-16 w-16 mx-auto mb-2" />
              <p className="text-lg font-semibold">Flow Canvas Area</p>
              <p>Drag and drop nodes from the panel to build your flow.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

    