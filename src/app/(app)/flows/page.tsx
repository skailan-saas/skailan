
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, ChevronDown, ChevronRight, Edit3, PlusCircle, ToyBrick, HelpCircle, GitMerge, Share2, Upload, Download, FileText, Trash2, MessageCircle, X } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { generateFlowFromPrompt as genFlowFnType } from "@/ai/flows";

// Dynamically import the AI function only on the client-side after mount
let generateFlowFn: typeof genFlowFnType | null = null;

const initialNodesData: Node[] = [
  { id: '1', type: 'input', data: { label: 'Start Node' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Default Message' }, position: { x: 250, y: 100 } },
  { id: '3', type: 'output', data: { label: 'End Node' }, position: { x: 250, y: 200 } },
];

const initialEdgesData: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
];

// Mock data for existing flows
const mockFlows = [
  { id: "1", name: "Welcome Flow", description: "Greets new users and offers initial options.", lastModified: "2024-07-28", status: "Published", icon: Bot },
  { id: "2", name: "Sales Inquiry", description: "Handles product questions and lead generation.", lastModified: "2024-07-25", status: "Draft", icon: ToyBrick },
  { id: "3", name: "Support Request", description: "Guides users through troubleshooting steps.", lastModified: "2024-07-22", status: "Published", icon: HelpCircle },
  { id: "4", name: "Feedback Collection", description: "Gathers user feedback post-interaction.", lastModified: "2024-07-20", status: "Archived", icon: GitMerge },
];

// Mock data for node types available in the sidebar
const nodeTypesForPalette = [
  { type: "text", label: "Send Message", icon: MessageCircle, description: "Sends a simple text message." },
  { type: "image", label: "Send Image", icon: FileText, description: "Sends an image." },
  { type: "buttons", label: "Buttons", icon: ChevronDown, description: "Sends a message with buttons." },
  { type: "carousel", label: "Carousel", icon: ChevronRight, description: "Sends a carousel of items." },
  { type: "userInput", label: "User Input", icon: Edit3, description: "Waits for user input." },
  { type: "condition", label: "Condition", icon: GitMerge, description: "Branches flow based on conditions." },
  { type: "action", label: "Action", icon: ToyBrick, description: "Performs an action (e.g., API call)." },
];


interface FlowBuilderCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

function FlowBuilderCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick }: FlowBuilderCanvasProps) {
  return (
    <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

let nodeIdCounter = initialNodesData.length; 

export default function FlowsPage() {
  const [flowPrompt, setFlowPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<Node | null>(null);


  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeForEdit(node);
  }, [setSelectedNodeForEdit]);


  useEffect(() => {
    import('@/ai/flows').then(module => {
      generateFlowFn = module.generateFlowFromPrompt;
    }).catch(err => console.error("Failed to load AI module", err));
  }, []);

  const handleGenerateFlow = async () => {    
    if (!flowPrompt.trim() || !generateFlowFn) return;
    setIsGenerating(true);
    setGeneratedConfig(null);
    try {
      const result = await generateFlowFn({ flowDescription: flowPrompt });
      setGeneratedConfig(result.flowConfiguration);
      // TODO: Parse result.flowConfiguration and set it to react-flow nodes/edges
    } catch (error) {
      console.error("Error generating flow:", error);
      setGeneratedConfig("Error generating flow. Please check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [selectedFlow, setSelectedFlow] = useState(mockFlows[0]);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const handleAddNode = (nodeTypeInfo: typeof nodeTypesForPalette[0]) => {
    nodeIdCounter++;
    const newNodeId = `node_${nodeIdCounter}`;
    
    const newPosition = {
      x: (nodes.length % 5) * 150 + 50, // Basic staggering
      y: Math.floor(nodes.length / 5) * 120 + 50, // Basic staggering
    };

    const newNode: Node = {
      id: newNodeId,
      type: 'default', // For now, all nodes are 'default'. Custom nodes would change this.
      position: newPosition,
      data: { label: `${nodeTypeInfo.label}` },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeForEdit(null); // Close editor if open when adding a new node
  };

  const handleNodeEditorClose = () => {
    setSelectedNodeForEdit(null);
  };
  
  const handleNodeDataChange = (newData: any) => {
    if (!selectedNodeForEdit) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeForEdit.id
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    // Also update selectedNodeForEdit to reflect changes immediately in the editor
    setSelectedNodeForEdit(prev => prev ? ({...prev, data: {...prev.data, ...newData }}) : null);
  };


  return (
    <ReactFlowProvider>
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
              <textarea placeholder="Paste your flow JSON here..." rows={10} className="w-full p-2 border rounded-md" />
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
                    <Label htmlFor="flow-config">Generated Configuration (JSON):</Label>
                    <textarea id="flow-config" readOnly value={generatedConfig} rows={10} className="w-full p-2 border rounded-md font-mono text-xs"/>
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

      <div className="flex-1 grid grid-cols-[300px_1fr_300px] overflow-hidden">
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
                    variant={selectedFlow?.id === flow.id ? "secondary" : "ghost"}
                    className="w-full h-auto justify-start p-3 text-left"
                    onClick={() => {
                        setSelectedFlow(flow);
                        setSelectedNodeForEdit(null); // Clear node editor when changing flow
                    }}
                    asChild
                  >
                    <div className="flex items-start gap-3 cursor-pointer">
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

        <div className="bg-muted/50 flex-1 overflow-auto p-6 relative" ref={reactFlowWrapper}>
          <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-xl font-semibold">{selectedFlow?.name || "Untitled Flow"}</h2>
                <p className="text-sm text-muted-foreground">Status: {selectedFlow?.status || "Draft"} - Last Saved: {selectedFlow?.lastModified || "Not saved"}</p>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline"><Download className="mr-2 h-4 w-4"/> Export</Button>
                 <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/> Share</Button>
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4"/> Save & Publish</Button>
                 <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete Flow</Button>
            </div>
          </div>
          <div className="w-full h-[calc(100%-80px)]"> {/* Ensure canvas has explicit height */}
             <FlowBuilderCanvas 
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClickHandler}
             />
          </div>
        </div>

        <Card className="rounded-none border-0 border-l flex flex-col">
          {selectedNodeForEdit ? (
            <>
              <CardHeader className="p-3 border-b flex-row justify-between items-center">
                 <CardTitle className="text-lg">Edit Node</CardTitle>
                 <Button variant="ghost" size="icon" onClick={handleNodeEditorClose} className="h-7 w-7">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="p-3 space-y-3">
                  <div>
                    <Label htmlFor="nodeId" className="text-xs text-muted-foreground">Node ID</Label>
                    <Input id="nodeId" readOnly value={selectedNodeForEdit.id} className="mt-1 h-8 bg-muted/50"/>
                  </div>
                  <div>
                    <Label htmlFor="nodeLabel" className="text-xs">Label</Label>
                    <Input 
                        id="nodeLabel" 
                        value={selectedNodeForEdit.data.label || ""} 
                        onChange={(e) => handleNodeDataChange({ label: e.target.value })}
                        className="mt-1 h-8"
                    />
                  </div>
                  {/* Placeholder for type-specific fields */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">Type: {selectedNodeForEdit.type || 'default'}</p>
                    <p className="text-xs text-muted-foreground mt-2">More editing options for this node type will appear here.</p>
                  </div>
                </CardContent>
              </ScrollArea>
              <CardFooter className="p-3 border-t">
                <Button onClick={handleNodeEditorClose} className="w-full">Done Editing</Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="p-3 border-b">
                 <CardTitle className="text-lg">Node Types</CardTitle>
                 <CardDescription className="text-xs">Click to add to canvas.</CardDescription>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="p-0">
                  <div className="p-2 space-y-1">
                     {nodeTypesForPalette.map((nodeType) => (
                        <Button
                            key={nodeType.type}
                            variant="ghost"
                            className="w-full h-auto justify-start p-3 text-left"
                            onClick={() => handleAddNode(nodeType)}
                        >
                            <nodeType.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                            <h4 className="font-medium text-sm">{nodeType.label}</h4>
                            <p className="text-xs text-muted-foreground">{nodeType.description}</p>
                            </div>
                        </Button>
                    ))}
                  </div>
                </CardContent>
              </ScrollArea>
            </>
          )}
        </Card>
      </div>
    </div>
    </ReactFlowProvider>
  );
}
