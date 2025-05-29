
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bot, ChevronDown, ChevronRight, Edit3, PlusCircle, ToyBrick, HelpCircle, GitMerge, Share2, Upload, Download, FileText, Trash2, MessageCircle, X, Image as ImageIcon, Plus, Settings } from "lucide-react";
import { useState, useCallback, useEffect, useRef, type FC } from "react";
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
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { generateFlowFromPrompt as genFlowFnType } from "@/ai/flows";
import { useToast } from "@/hooks/use-toast";


let generateFlowFn: typeof genFlowFnType | null = null;

interface FlowListItem {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  status: "Published" | "Draft" | "Archived";
  icon: FC<React.SVGProps<SVGSVGElement>>; // Lucide icon component type
}

const initialMockFlows: FlowListItem[] = [
  { id: "1", name: "Welcome Flow", description: "Greets new users and offers initial options.", lastModified: "2024-07-28", status: "Published", icon: Bot },
  { id: "2", name: "Sales Inquiry", description: "Handles product questions and lead generation.", lastModified: "2024-07-25", status: "Draft", icon: ToyBrick },
  { id: "3", name: "Support Request", description: "Guides users through troubleshooting steps.", lastModified: "2024-07-22", status: "Published", icon: HelpCircle },
  { id: "4", name: "Feedback Collection", description: "Gathers user feedback post-interaction.", lastModified: "2024-07-20", status: "Archived", icon: GitMerge },
];

const initialNodesData: Node[] = [
  { id: '1', type: 'input', data: { label: 'Start Node' }, position: { x: 250, y: 5 } },
  { id: '2', type: 'text', data: { label: 'Welcome Message', messageText: 'Hello! Welcome to our service.' }, position: { x: 250, y: 100 } },
  { id: '3', type: 'output', data: { label: 'End Node' }, position: { x: 250, y: 250 } },
];

const initialEdgesData: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
];

const nodeTypesForPalette = [
  { type: "text", label: "Send Message", icon: MessageCircle, description: "Sends a simple text message." },
  { type: "image", label: "Send Image", icon: ImageIcon, description: "Sends an image." },
  { type: "buttons", label: "Buttons", icon: ChevronDown, description: "Sends a message with interactive buttons." },
  { type: "carousel", label: "Carousel", icon: ChevronRight, description: "Sends a carousel of items (placeholder editor)." },
  { type: "userInput", label: "User Input", icon: Edit3, description: "Waits for and captures user input." },
  { type: "condition", label: "Condition", icon: GitMerge, description: "Branches flow based on conditions." },
  { type: "action", label: "Action", icon: Settings, description: "Performs an action (e.g., API call, set variable)." },
];

interface FlowBuilderCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  nodeTypes?: NodeTypes;
}

function FlowBuilderCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, nodeTypes }: FlowBuilderCanvasProps) {
  return (
    <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

let nodeIdCounter = initialNodesData.length;
let buttonIdCounter = 0;

export default function FlowsPage() {
  const { toast } = useToast();
  const [flowPrompt, setFlowPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<Node | null>(null);
  
  const [mockFlows, setMockFlows] = useState<FlowListItem[]>(initialMockFlows);
  const [selectedFlow, setSelectedFlow] = useState<FlowListItem | null>(mockFlows[0] || null);

  const [isEditFlowDialogOpen, setIsEditFlowDialogOpen] = useState(false);
  const [flowToEdit, setFlowToEdit] = useState<FlowListItem | null>(null);
  const [editFlowName, setEditFlowName] = useState("");
  const [editFlowDescription, setEditFlowDescription] = useState("");

  const [isDeleteFlowConfirmOpen, setIsDeleteFlowConfirmOpen] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('@/ai/flows').then(module => {
      generateFlowFn = module.generateFlowFromPrompt;
    }).catch(err => console.error("Failed to load AI module", err));
  }, []);

  useEffect(() => {
    if (flowToEdit) {
      setEditFlowName(flowToEdit.name);
      setEditFlowDescription(flowToEdit.description);
    }
  }, [flowToEdit]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeForEdit(node);
  }, []);

  const handleGenerateFlow = async () => {    
    if (!flowPrompt.trim() || !generateFlowFn) return;
    setIsGenerating(true);
    setGeneratedConfig(null);
    try {
      const result = await generateFlowFn({ flowDescription: flowPrompt });
      setGeneratedConfig(result.flowConfiguration);
      console.log("Generated Flow Config:", result.flowConfiguration);
      toast({ title: "Flow Configuration Generated", description: "JSON config is ready. Implement parsing to load it into the canvas." });
    } catch (error) {
      console.error("Error generating flow:", error);
      setGeneratedConfig("Error generating flow. Please check console.");
      toast({ title: "Error Generating Flow", description: "Could not generate flow configuration.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddNode = (nodePaletteItem: typeof nodeTypesForPalette[0]) => {
    nodeIdCounter++;
    const newNodeId = `node_${nodeIdCounter}`;
    const newPosition = { x: (nodes.length % 5) * 150 + 50, y: Math.floor(nodes.length / 5) * 120 + 50 };
    
    let newNodeData: any = { label: nodePaletteItem.label };

    switch (nodePaletteItem.type) {
      case 'text':
        newNodeData.messageText = '';
        break;
      case 'image':
        newNodeData.imageUrl = '';
        newNodeData.altText = '';
        break;
      case 'buttons':
        newNodeData.messageText = '';
        newNodeData.buttons = [{ id: `btn-${buttonIdCounter++}`, label: 'Button 1', payload: 'payload_1' }];
        break;
      case 'carousel':
        newNodeData.carouselConfigText = '/* Define carousel items here (e.g., JSON) */';
        break;
      case 'userInput':
        newNodeData.promptText = 'Please enter your value:';
        newNodeData.variableName = '';
        break;
      case 'condition':
        newNodeData.variable = '';
        newNodeData.operator = 'equals';
        newNodeData.value = '';
        break;
      case 'action':
        newNodeData.actionType = 'api_call';
        newNodeData.actionParams = '';
        break;
      default:
        break;
    }

    const newNode: Node = {
      id: newNodeId,
      type: nodePaletteItem.type,
      position: newPosition,
      data: newNodeData,
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeForEdit(null);
  };

  const handleNodeEditorClose = () => {
    setSelectedNodeForEdit(null);
  };
  
  const handleNodeDataChange = (newData: any) => {
    if (!selectedNodeForEdit) return;
    const updatedNodeData = { ...selectedNodeForEdit.data, ...newData };
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeForEdit.id
          ? { ...node, data: updatedNodeData }
          : node
      )
    );
    setSelectedNodeForEdit(prev => prev ? ({...prev, data: updatedNodeData }) : null);
  };

  const handleButtonChange = (buttonIndex: number, field: 'label' | 'payload', value: string) => {
    if (!selectedNodeForEdit || selectedNodeForEdit.type !== 'buttons' || !selectedNodeForEdit.data.buttons) return;
    const newButtons = [...selectedNodeForEdit.data.buttons];
    newButtons[buttonIndex] = { ...newButtons[buttonIndex], [field]: value };
    handleNodeDataChange({ buttons: newButtons });
  };

  const addChoiceButton = () => {
    if (!selectedNodeForEdit || selectedNodeForEdit.type !== 'buttons') return;
    const newButton = { id: `btn-${buttonIdCounter++}`, label: 'New Button', payload: `payload_${buttonIdCounter}` };
    const newButtons = [...(selectedNodeForEdit.data.buttons || []), newButton];
    handleNodeDataChange({ buttons: newButtons });
  };

  const removeChoiceButton = (buttonIdToRemove: string) => {
    if (!selectedNodeForEdit || selectedNodeForEdit.type !== 'buttons' || !selectedNodeForEdit.data.buttons) return;
    const newButtons = selectedNodeForEdit.data.buttons.filter(btn => btn.id !== buttonIdToRemove);
    handleNodeDataChange({ buttons: newButtons });
  };

  const handleDeleteNode = () => {
    if (!selectedNodeForEdit) return;
    const nodeIdToDelete = selectedNodeForEdit.id;
    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete));
    setSelectedNodeForEdit(null);
    toast({ title: "Node Deleted", description: `Node ${nodeIdToDelete} and its connections have been removed.`});
  };

  const handleOpenEditFlowDialog = (flow: FlowListItem) => {
    setFlowToEdit(flow);
    setIsEditFlowDialogOpen(true);
  };

  const handleSaveFlowDetails = () => {
    if (!flowToEdit) return;
    const updatedFlows = mockFlows.map(f => 
      f.id === flowToEdit.id ? { ...f, name: editFlowName, description: editFlowDescription, lastModified: new Date().toISOString().split('T')[0] } : f
    );
    setMockFlows(updatedFlows);
    if (selectedFlow && selectedFlow.id === flowToEdit.id) {
      setSelectedFlow(updatedFlows.find(f => f.id === flowToEdit.id) || null);
    }
    setIsEditFlowDialogOpen(false);
    setFlowToEdit(null);
    toast({ title: "Flow Details Updated", description: `Details for "${editFlowName}" saved.`});
  };

  const handleConfirmDeleteFlow = () => {
    if (!selectedFlow) return;
    const flowNameToDelete = selectedFlow.name;
    setMockFlows(prevFlows => prevFlows.filter(f => f.id !== selectedFlow.id));
    
    setSelectedFlow(null);
    setNodes(initialNodesData); // Reset canvas or load next flow
    setEdges(initialEdgesData);
    setSelectedNodeForEdit(null);

    setIsDeleteFlowConfirmOpen(false);
    toast({ title: "Flow Deleted", description: `Flow "${flowNameToDelete}" has been deleted.`});
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
              <Textarea placeholder="Paste your flow JSON here..." rows={10} className="w-full p-2 border rounded-md" />
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
                    <Textarea id="flow-config" readOnly value={generatedConfig} rows={10} className="w-full p-2 border rounded-md font-mono text-xs"/>
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

      <div className="flex-1 grid grid-cols-[300px_1fr_350px] overflow-hidden">
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
                        // TODO: Load nodes/edges for this flow. For now, resetting to initial.
                        setNodes(initialNodesData); 
                        setEdges(initialEdgesData);
                        setSelectedNodeForEdit(null); 
                    }}
                    asChild
                  >
                    <div className="flex items-start gap-3 cursor-pointer w-full">
                      <flow.icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-medium truncate">{flow.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{flow.description}</p>
                        <p className="text-xs text-muted-foreground">Last modified: {flow.lastModified} - <span className={flow.status === 'Published' ? 'text-green-600' : flow.status === 'Draft' ? 'text-yellow-600' : 'text-muted-foreground'}>{flow.status}</span></p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 self-center" onClick={(e) => {e.stopPropagation(); handleOpenEditFlowDialog(flow);}}>
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
                <h2 className="text-xl font-semibold">{selectedFlow?.name || "Select a Flow"}</h2>
                {selectedFlow && <p className="text-sm text-muted-foreground">Status: {selectedFlow.status} - Last Saved: {selectedFlow.lastModified}</p>}
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" disabled={!selectedFlow}><Download className="mr-2 h-4 w-4"/> Export</Button>
                 <Button variant="outline" disabled={!selectedFlow}><Share2 className="mr-2 h-4 w-4"/> Share</Button>
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!selectedFlow}><PlusCircle className="mr-2 h-4 w-4"/> Save & Publish</Button>
                 <Button variant="destructive" onClick={() => setIsDeleteFlowConfirmOpen(true)} disabled={!selectedFlow}><Trash2 className="mr-2 h-4 w-4"/> Delete Flow</Button>
            </div>
          </div>
          <div className="w-full h-[calc(100%-80px)]">
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
                 <CardTitle className="text-lg">Edit: {selectedNodeForEdit.data.label || 'Node'}</CardTitle>
                 <Button variant="ghost" size="icon" onClick={handleNodeEditorClose} className="h-7 w-7">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="p-3 space-y-4">
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
                  <Separator />
                  
                  {selectedNodeForEdit.type === 'text' && (
                    <div>
                      <Label htmlFor="nodeMessageText">Message Text</Label>
                      <Textarea
                        id="nodeMessageText"
                        value={selectedNodeForEdit.data.messageText || ""}
                        onChange={(e) => handleNodeDataChange({ messageText: e.target.value })}
                        placeholder="Enter message to send..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  )}

                  {selectedNodeForEdit.type === 'image' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="nodeImageUrl">Image URL</Label>
                        <Input 
                            id="nodeImageUrl" 
                            value={selectedNodeForEdit.data.imageUrl || ""} 
                            onChange={(e) => handleNodeDataChange({ imageUrl: e.target.value })}
                            placeholder="https://example.com/image.png"
                            className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nodeImageAltText">Alt Text (Optional)</Label>
                        <Input 
                            id="nodeImageAltText" 
                            value={selectedNodeForEdit.data.altText || ""} 
                            onChange={(e) => handleNodeDataChange({ altText: e.target.value })}
                            placeholder="Descriptive text for the image"
                            className="mt-1 h-8"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNodeForEdit.type === 'buttons' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="buttonsNodeMessageText">Message Text (Optional)</Label>
                        <Textarea
                          id="buttonsNodeMessageText"
                          value={selectedNodeForEdit.data.messageText || ""}
                          onChange={(e) => handleNodeDataChange({ messageText: e.target.value })}
                          placeholder="Enter a message to display with buttons..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <Label>Buttons</Label>
                      {selectedNodeForEdit.data.buttons?.map((button: { id: string; label: string; payload: string; }, index: number) => (
                        <Card key={button.id} className="p-2 space-y-1 bg-muted/50">
                          <div className="flex justify-between items-center">
                             <p className="text-xs font-medium">Button {index + 1}</p>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeChoiceButton(button.id)}>
                               <Trash2 className="h-3 w-3 text-destructive"/>
                             </Button>
                          </div>
                          <div>
                            <Label htmlFor={`buttonLabel-${button.id}`} className="text-xs">Label</Label>
                            <Input 
                              id={`buttonLabel-${button.id}`}
                              value={button.label}
                              onChange={(e) => handleButtonChange(index, 'label', e.target.value)}
                              placeholder="Button Text"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`buttonPayload-${button.id}`} className="text-xs">Payload</Label>
                            <Input 
                              id={`buttonPayload-${button.id}`}
                              value={button.payload}
                              onChange={(e) => handleButtonChange(index, 'payload', e.target.value)}
                              placeholder="Action or Value"
                              className="h-8 text-xs"
                            />
                          </div>
                        </Card>
                      ))}
                      <Button variant="outline" size="sm" onClick={addChoiceButton} className="w-full">
                        <Plus className="mr-2 h-4 w-4"/> Add Button
                      </Button>
                    </div>
                  )}
                  
                  {selectedNodeForEdit.type === 'userInput' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="userInputPromptText">Prompt Text</Label>
                        <Textarea
                          id="userInputPromptText"
                          value={selectedNodeForEdit.data.promptText || ""}
                          onChange={(e) => handleNodeDataChange({ promptText: e.target.value })}
                          placeholder="What question to ask the user?"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="userInputVarName">Variable Name (Optional)</Label>
                        <Input 
                            id="userInputVarName" 
                            value={selectedNodeForEdit.data.variableName || ""} 
                            onChange={(e) => handleNodeDataChange({ variableName: e.target.value })}
                            placeholder="e.g., user_email"
                            className="mt-1 h-8"
                        />
                         <p className="text-xs text-muted-foreground mt-1">Store user's reply in this variable.</p>
                      </div>
                    </div>
                  )}

                  {selectedNodeForEdit.type === 'condition' && (
                    <div className="space-y-3">
                       <div>
                        <Label htmlFor="conditionVariable">Variable Name</Label>
                        <Input 
                            id="conditionVariable" 
                            value={selectedNodeForEdit.data.variable || ""} 
                            onChange={(e) => handleNodeDataChange({ variable: e.target.value })}
                            placeholder="e.g., user_email or last_message"
                            className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="conditionOperator">Operator</Label>
                        <Select
                            value={selectedNodeForEdit.data.operator || "equals"}
                            onValueChange={(value) => handleNodeDataChange({ operator: value })}
                        >
                            <SelectTrigger id="conditionOperator" className="mt-1 h-8">
                                <SelectValue placeholder="Select operator" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="starts_with">Starts With</SelectItem>
                                <SelectItem value="ends_with">Ends With</SelectItem>
                                <SelectItem value="is_set">Is Set (Exists)</SelectItem>
                                <SelectItem value="is_not_set">Is Not Set</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                       <div>
                        <Label htmlFor="conditionValue">Value to Compare</Label>
                        <Input 
                            id="conditionValue" 
                            value={selectedNodeForEdit.data.value || ""} 
                            onChange={(e) => handleNodeDataChange({ value: e.target.value })}
                            placeholder="Value for comparison"
                            className="mt-1 h-8"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNodeForEdit.type === 'action' && (
                    <div className="space-y-3">
                       <div>
                        <Label htmlFor="actionType">Action Type</Label>
                        <Select
                            value={selectedNodeForEdit.data.actionType || "api_call"}
                            onValueChange={(value) => handleNodeDataChange({ actionType: value })}
                        >
                            <SelectTrigger id="actionType" className="mt-1 h-8">
                                <SelectValue placeholder="Select action type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="api_call">API Call</SelectItem>
                                <SelectItem value="set_variable">Set Variable</SelectItem>
                                <SelectItem value="assign_agent">Assign to Agent</SelectItem>
                                <SelectItem value="add_tag">Add Tag</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="actionParams">Action Parameters</Label>
                        <Textarea
                          id="actionParams"
                          value={selectedNodeForEdit.data.actionParams || ""}
                          onChange={(e) => handleNodeDataChange({ actionParams: e.target.value })}
                          placeholder="e.g., API URL, Variable Name & Value (JSON or text)"
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {selectedNodeForEdit.type === 'carousel' && (
                    <div>
                      <Label htmlFor="nodeCarouselConfig">Carousel Configuration</Label>
                      <Textarea
                        id="nodeCarouselConfig"
                        value={selectedNodeForEdit.data.carouselConfigText || ""}
                        onChange={(e) => handleNodeDataChange({ carouselConfigText: e.target.value })}
                        placeholder="Define carousel items here (e.g., in JSON format or detailed description). Full UI for carousels coming soon."
                        className="mt-1"
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground mt-1">A more structured editor for carousels will be implemented later.</p>
                    </div>
                  )}

                  {![ 'text', 'image', 'buttons', 'userInput', 'condition', 'action', 'carousel'].includes(selectedNodeForEdit.type || 'default') && 
                   (selectedNodeForEdit.type === 'input' || selectedNodeForEdit.type === 'output' || selectedNodeForEdit.type === 'default' || !selectedNodeForEdit.type) && (
                     <div className="pt-2">
                        <p className="text-xs text-muted-foreground">Type: {selectedNodeForEdit.type || 'default'}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Standard input/output/default nodes have basic label editing.
                            Specific editing options for custom type '{selectedNodeForEdit.type}' are not yet implemented if not listed above.
                        </p>
                    </div>
                  )}

                </CardContent>
              </ScrollArea>
              <CardFooter className="p-3 border-t flex flex-col gap-2">
                <Button onClick={handleNodeEditorClose} className="w-full">Done Editing</Button>
                <Button variant="destructive" onClick={handleDeleteNode} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4"/> Delete Node
                </Button>
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
                     {nodeTypesForPalette.map((nodeTypeInfo) => (
                        <Button
                            key={nodeTypeInfo.type}
                            variant="ghost"
                            className="w-full h-auto justify-start p-3 text-left"
                            onClick={() => handleAddNode(nodeTypeInfo)}
                        >
                            <nodeTypeInfo.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                            <h4 className="font-medium text-sm">{nodeTypeInfo.label}</h4>
                            <p className="text-xs text-muted-foreground">{nodeTypeInfo.description}</p>
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

      {/* Edit Flow Details Dialog */}
      <Dialog open={isEditFlowDialogOpen} onOpenChange={setIsEditFlowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flow Details: {flowToEdit?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editFlowName">Flow Name</Label>
              <Input id="editFlowName" value={editFlowName} onChange={(e) => setEditFlowName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="editFlowDescription">Description</Label>
              <Textarea id="editFlowDescription" value={editFlowDescription} onChange={(e) => setEditFlowDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFlowDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFlowDetails}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Flow Confirmation Dialog */}
      <AlertDialog open={isDeleteFlowConfirmOpen} onOpenChange={setIsDeleteFlowConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this flow?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the flow
              "{selectedFlow?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteFlow} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Flow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    </ReactFlowProvider>
  );
}


    