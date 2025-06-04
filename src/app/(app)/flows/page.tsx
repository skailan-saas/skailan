"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Edit3,
  PlusCircle,
  ToyBrick,
  HelpCircle,
  GitMerge,
  Share2,
  Upload,
  Download,
  FileText,
  Trash2,
  MessageCircle,
  X,
  ImageIcon,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  type FC,
} from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";

import type { generateFlowFromPrompt as genFlowFnType } from "@/ai/flows";
import { useToast } from "@/hooks/use-toast";
import {
  getFlow,
  getFlows,
  createFlow,
  updateFlow,
  publishFlow,
  deleteFlow,
  type FlowFE,
} from "./actions";
import { validateReactFlowConfig } from "@/ai/flows/generate-flow-from-prompt";

let generateFlowFn: typeof genFlowFnType | null = null;

interface FlowListItem {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  status: "Published" | "Draft" | "Archived";
  icon: FC<React.SVGProps<SVGSVGElement>>;
  nodes?: Node[];
  edges?: Edge[];
}

const initialNodesData: Node[] = [
  {
    id: "start-node",
    type: "input",
    data: { label: "Start" },
    position: { x: 250, y: 5 },
  },
  {
    id: "default-message",
    type: "text",
    data: {
      label: "Welcome Message",
      messageText: "Hello! This is a default welcome message.",
    },
    position: { x: 250, y: 100 },
  },
  {
    id: "end-node",
    type: "output",
    data: { label: "End" },
    position: { x: 250, y: 250 },
  },
];
const initialEdgesData: Edge[] = [
  {
    id: "e-start-message",
    source: "start-node",
    target: "default-message",
    animated: true,
  },
  { id: "e-message-end", source: "default-message", target: "end-node" },
];

// Los flujos ahora se cargan desde la base de datos
const initialFlowsData: FlowListItem[] = [];

const nodeTypesForPalette = [
  {
    type: "text",
    label: "Send Message",
    icon: MessageCircle,
    description: "Sends a simple text message.",
  },
  {
    type: "image",
    label: "Send Image",
    icon: ImageIcon,
    description: "Sends an image.",
  },
  {
    type: "buttons",
    label: "Buttons",
    icon: ChevronDown,
    description: "Sends a message with interactive buttons.",
  },
  {
    type: "carousel",
    label: "Carousel",
    icon: ChevronRight,
    description: "Sends a carousel of items.",
  },
  {
    type: "userInput",
    label: "User Input",
    icon: Edit3,
    description: "Waits for and captures user input.",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitMerge,
    description: "Branches flow based on conditions.",
  },
  {
    type: "action",
    label: "Action",
    icon: Settings,
    description: "Performs an action (e.g., API call, set variable).",
  },
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

function FlowBuilderCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  nodeTypes,
}: FlowBuilderCanvasProps) {
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

let nodeIdCounter =
  Math.max(
    ...initialFlowsData.flatMap(
      (f) => f.nodes?.map((n) => parseInt(n.id.split("_").pop() || "0")) || [0]
    ),
    0
  ) + 1;
let buttonIdCounter = 0;

export default function FlowsPage() {
  const { toast } = useToast();
  const [flowPrompt, setFlowPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null);

  const [flows, setFlows] = useState<FlowListItem[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<FlowListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    selectedFlow?.nodes || initialNodesData
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    selectedFlow?.edges || initialEdgesData
  );
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<Node | null>(
    null
  );

  const [isEditFlowDetailsDialogOpen, setIsEditFlowDetailsDialogOpen] =
    useState(false);
  const [flowToEditDetails, setFlowToEditDetails] =
    useState<FlowListItem | null>(null);
  const [editFlowName, setEditFlowName] = useState("");
  const [editFlowDescription, setEditFlowDescription] = useState("");

  const [isDeleteFlowConfirmOpen, setIsDeleteFlowConfirmOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<FlowListItem | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@/ai/flows")
      .then((module) => {
        generateFlowFn = module.generateFlowFromPrompt;
      })
      .catch((err) => console.error("Failed to load AI module", err));
  }, []);

  // Cargar flujos desde la base de datos
  useEffect(() => {
    async function loadFlows() {
      try {
        setIsLoading(true);
        const flowsData = await getFlows();

        // Convertir FlowFE a FlowListItem
        const convertedFlows: FlowListItem[] = flowsData.map((flow) => ({
          id: flow.id,
          name: flow.name,
          description: flow.description || "",
          lastModified: flow.updatedAt.toISOString().split("T")[0],
          status: flow.status as "Published" | "Draft" | "Archived",
          icon:
            flow.status === "PUBLISHED"
              ? Bot
              : flow.status === "DRAFT"
              ? ToyBrick
              : HelpCircle,
          nodes: flow.definition.nodes || [],
          edges: flow.definition.edges || [],
        }));

        setFlows(convertedFlows);
        if (convertedFlows.length > 0 && !selectedFlow) {
          setSelectedFlow(convertedFlows[0]);
        }
      } catch (error) {
        console.error("Error loading flows:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los flujos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadFlows();
  }, []);

  useEffect(() => {
    if (flowToEditDetails) {
      setEditFlowName(flowToEditDetails.name);
      setEditFlowDescription(flowToEditDetails.description);
    }
  }, [flowToEditDetails]);

  useEffect(() => {
    if (selectedFlow) {
      setNodes(selectedFlow.nodes || []);
      setEdges(selectedFlow.edges || []);
      setSelectedNodeForEdit(null);
    } else {
      setNodes(initialNodesData);
      setEdges(initialEdgesData);
      setSelectedNodeForEdit(null);
    }
  }, [selectedFlow, setNodes, setEdges]);

  // Auto-save changes to database
  useEffect(() => {
    if (selectedFlow && (nodes.length > 0 || edges.length > 0)) {
      const saveTimeout = setTimeout(async () => {
        try {
          // First check if flow exists in database
          let dbFlow;
          try {
            dbFlow = await getFlow(selectedFlow.id).catch(() => null);
          } catch {
            dbFlow = null;
          }
          if (!dbFlow) {
            console.log("Flow not found in DB, creating new version");
            await createFlow({
              name: selectedFlow.name,
              description: selectedFlow.description,
              definition: { nodes, edges },
            });
          } else {
            await updateFlow(selectedFlow.id, {
              definition: { nodes: nodes as any, edges: edges as any },
            });
          }

          // Update local state
          setFlows((prevFlows) =>
            prevFlows.map((flow) =>
              flow.id === selectedFlow.id
                ? {
                    ...flow,
                    nodes: nodes,
                    edges: edges,
                    lastModified: new Date().toISOString().split("T")[0],
                  }
                : flow
            )
          );

          console.log("Flow auto-saved");
        } catch (error) {
          console.error("Error auto-saving flow:", error);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(saveTimeout);
    }
  }, [nodes, edges, selectedFlow?.id]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeForEdit(node);
    },
    []
  );

  const handleGenerateFlow = async () => {
    if (!flowPrompt.trim() || !generateFlowFn) return;
    setIsGenerating(true);
    setGeneratedConfig(null);
    try {
      const result = await generateFlowFn({ flowDescription: flowPrompt });
      setGeneratedConfig(result.flowConfiguration);
      toast({
        title: "Flow Configuration Generated",
        description: "JSON config is ready to be used.",
      });
    } catch (error) {
      console.error("Error generating flow:", error);
      setGeneratedConfig("Error generating flow. Please check console.");
      toast({
        title: "Error Generating Flow",
        description: "Could not generate flow configuration.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!selectedFlow) return;

    try {
      // First save the current flow state
      await updateFlow(selectedFlow.id, {
        definition: { nodes: nodes as any, edges: edges as any },
      });

      // Then publish it
      const publishedFlow = await publishFlow(selectedFlow.id);

      // Update local state
      setFlows(
        flows.map((flow) =>
          flow.id === selectedFlow.id ? { ...flow, status: "Published" } : flow
        )
      );
      setSelectedFlow({ ...selectedFlow, status: "Published" });

      toast({
        title: "Flow Published",
        description: `"${selectedFlow.name}" has been published successfully`,
      });
    } catch (error) {
      console.error("Error saving and publishing flow:", error);
      toast({
        title: "Error",
        description: "Failed to save and publish flow",
        variant: "destructive",
      });
    }
  };

  const handleGeneratedFlowAndCreate = async () => {
    if (!generatedConfig) {
      toast({
        title: "No Configuration",
        description: "Genera primero una configuración de flujo.",
        variant: "destructive",
      });
      return;
    }

    // Validar el JSON generado por la IA
    const validation = validateReactFlowConfig(generatedConfig);
    if (!validation.valid) {
      toast({
        title: "Error de validación",
        description: validation.error || "El flujo generado no es válido.",
        variant: "destructive",
      });
      return;
    }

    const { nodes: parsedNodes, edges: parsedEdges } = validation.parsed;
    const flowName = flowPrompt.substring(0, 30).trim() || "New AI Flow";
    const flowDesc = flowPrompt || "Flow generated by AI";

    // --- GUARDAR EN LA BASE DE DATOS ---
    try {
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: flowName,
          description: flowDesc,
          definition: { nodes: parsedNodes, edges: parsedEdges },
          status: "DRAFT",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error al guardar",
          description: error.error || "No se pudo guardar el flujo.",
          variant: "destructive",
        });
        return;
      }

      const flowGuardado = await response.json();

      setFlows((prev) => [
        {
          id: flowGuardado.id,
          name: flowGuardado.name,
          description: flowGuardado.description,
          lastModified: flowGuardado.updatedAt.split("T")[0],
          status: flowGuardado.status,
          icon: Bot,
          nodes: flowGuardado.definition.nodes,
          edges: flowGuardado.definition.edges,
        },
        ...prev,
      ]);
      setSelectedFlow({
        id: flowGuardado.id,
        name: flowGuardado.name,
        description: flowGuardado.description,
        lastModified: flowGuardado.updatedAt.split("T")[0],
        status: flowGuardado.status,
        icon: Bot,
        nodes: flowGuardado.definition.nodes,
        edges: flowGuardado.definition.edges,
      });
      setFlowPrompt("");
      setGeneratedConfig(null);
      toast({
        title: "Flujo creado",
        description: `El flujo "${flowGuardado.name}" fue guardado y seleccionado.`,
      });
    } catch (err) {
      toast({
        title: "Error inesperado",
        description: "No se pudo guardar el flujo. Intenta de nuevo.",
        variant: "destructive",
      });
      console.error("Error al guardar el flujo:", err);
    }
  };

  const handleAddNode = (nodePaletteItem: (typeof nodeTypesForPalette)[0]) => {
    if (!selectedFlow) {
      toast({
        title: "No Flow Selected",
        description: "Please select or create a flow to add nodes.",
        variant: "destructive",
      });
      return;
    }
    nodeIdCounter++;
    const newNodeId = `node_${selectedFlow.id}_${nodeIdCounter}`;
    const currentNodesCount = nodes.length;
    const newPosition = {
      x: (currentNodesCount % 5) * 150 + 50,
      y: Math.floor(currentNodesCount / 5) * 120 + 50,
    };

    let newNodeData: any = { label: nodePaletteItem.label };

    switch (nodePaletteItem.type) {
      case "text":
        newNodeData.messageText = "Edit this message";
        break;
      case "image":
        newNodeData.imageUrl = "https://placehold.co/300x200.png";
        newNodeData.altText = "Placeholder image";
        break;
      case "buttons":
        newNodeData.messageText = "Choose an option:";
        newNodeData.buttons = [
          {
            id: `btn-${selectedFlow.id}-${buttonIdCounter++}`,
            label: "Button 1",
            payload: "payload_1",
          },
        ];
        break;
      case "carousel":
        newNodeData.carouselConfigText =
          '[{"title": "Item 1", "imageUrl": "https://placehold.co/200x150.png", "buttons": [{"label": "View", "payload": "view_1"}]}]';
        break;
      case "userInput":
        newNodeData.promptText = "Please enter your value:";
        newNodeData.variableName = "user_response";
        break;
      case "condition":
        newNodeData.variable = "last_message";
        newNodeData.operator = "equals";
        newNodeData.value = "yes";
        break;
      case "action":
        newNodeData.actionType = "api_call";
        newNodeData.actionParams =
          '{"url": "https://api.example.com/data", "method": "GET"}';
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
    setSelectedNodeForEdit((prev) =>
      prev ? { ...prev, data: updatedNodeData } : null
    );
  };

  const handleButtonChange = (
    buttonIndex: number,
    field: "label" | "payload",
    value: string
  ) => {
    if (
      !selectedNodeForEdit ||
      selectedNodeForEdit.type !== "buttons" ||
      !selectedNodeForEdit.data.buttons
    )
      return;
    const newButtons = [...selectedNodeForEdit.data.buttons];
    newButtons[buttonIndex] = { ...newButtons[buttonIndex], [field]: value };
    handleNodeDataChange({ buttons: newButtons });
  };

  const addChoiceButton = () => {
    if (!selectedNodeForEdit || selectedNodeForEdit.type !== "buttons") return;
    const flowIdPrefix = selectedFlow ? selectedFlow.id : "global";
    const newButton = {
      id: `btn-${flowIdPrefix}-${buttonIdCounter++}`,
      label: "New Button",
      payload: `payload_${buttonIdCounter}`,
    };
    const newButtons = [...(selectedNodeForEdit.data.buttons || []), newButton];
    handleNodeDataChange({ buttons: newButtons });
  };

  const removeChoiceButton = (buttonIdToRemove: string) => {
    if (
      !selectedNodeForEdit ||
      selectedNodeForEdit.type !== "buttons" ||
      !selectedNodeForEdit.data.buttons
    )
      return;
    const newButtons = selectedNodeForEdit.data.buttons.filter(
      (btn: { id: string }) => btn.id !== buttonIdToRemove
    );
    handleNodeDataChange({ buttons: newButtons });
  };

  const handleDeleteNode = () => {
    if (!selectedNodeForEdit) return;
    const nodeIdToDelete = selectedNodeForEdit.id;
    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete
      )
    );
    setSelectedNodeForEdit(null);
    toast({
      title: "Node Deleted",
      description: `Node ${nodeIdToDelete} and its connections have been removed.`,
    });
  };

  const handleOpenEditFlowDetailsDialog = (flow: FlowListItem) => {
    setFlowToEditDetails(flow);
    setIsEditFlowDetailsDialogOpen(true);
  };

  const handleSaveFlowDetails = () => {
    if (!flowToEditDetails) return;
    const updatedFlows = flows.map((f) =>
      f.id === flowToEditDetails.id
        ? {
            ...f,
            name: editFlowName,
            description: editFlowDescription,
            lastModified: new Date().toISOString().split("T")[0],
          }
        : f
    );
    setFlows(updatedFlows);
    if (selectedFlow && selectedFlow.id === flowToEditDetails.id) {
      setSelectedFlow(
        updatedFlows.find((f) => f.id === flowToEditDetails.id) || null
      );
    }
    setIsEditFlowDetailsDialogOpen(false);
    setFlowToEditDetails(null);
    toast({
      title: "Flow Details Updated",
      description: `Details for "${editFlowName}" saved.`,
    });
  };

  const triggerDeleteFlowConfirmation = (flow: FlowListItem) => {
    setFlowToDelete(flow);
    setIsDeleteFlowConfirmOpen(true);
  };

  const handleConfirmDeleteFlow = () => {
    if (!flowToDelete) return;
    const flowNameToDelete = flowToDelete.name;
    const updatedFlows = flows.filter((f) => f.id !== flowToDelete.id);
    setFlows(updatedFlows);

    if (selectedFlow && selectedFlow.id === flowToDelete.id) {
      setSelectedFlow(updatedFlows.length > 0 ? updatedFlows[0] : null);
    }

    setFlowToDelete(null);
    setIsDeleteFlowConfirmOpen(false);
    toast({
      title: "Flow Deleted",
      description: `Flow "${flowNameToDelete}" has been deleted.`,
    });
  };

  return (
    <ReactFlowProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-muted/30">
        <header className="flex items-center justify-between p-4 border-b bg-background shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold">Visual Flow Builder</h1>
            <p className="text-muted-foreground">
              Design and manage your conversational flows.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Import Flow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Flow Configuration</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder="Paste your flow JSON here..."
                  rows={10}
                  className="w-full p-2 border rounded-md"
                />
                <DialogFooter>
                  <Button type="submit">Import</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Flow
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Create New Flow with AI</DialogTitle>
                  <CardDescription>
                    Describe the flow you want to create, and our AI will
                    generate a starting configuration for you.
                  </CardDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Textarea
                    placeholder="e.g., A flow to welcome new users, ask for their email, and then offer them a discount code if they subscribe."
                    value={flowPrompt}
                    onChange={(e) => setFlowPrompt(e.target.value)}
                    disabled={isGenerating}
                    rows={4}
                  />
                  {generatedConfig && (
                    <div className="space-y-2">
                      <Label htmlFor="flow-config">
                        Generated Configuration (JSON):
                      </Label>
                      <Textarea
                        id="flow-config"
                        readOnly
                        value={generatedConfig}
                        rows={8}
                        className="w-full p-2 border rounded-md font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleGenerateFlow}
                    disabled={
                      isGenerating || !flowPrompt.trim() || !generateFlowFn
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" />{" "}
                    {isGenerating ? "Generating..." : "Generate with AI"}
                  </Button>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      onClick={handleGeneratedFlowAndCreate}
                      disabled={!generatedConfig}
                    >
                      Create & Edit Flow
                    </Button>
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
                  {flows.map((flow) => (
                    <Button
                      key={flow.id}
                      variant={
                        selectedFlow?.id === flow.id ? "secondary" : "ghost"
                      }
                      className="w-full h-auto justify-start p-3 text-left"
                      onClick={() => setSelectedFlow(flow)}
                      asChild
                    >
                      <div className="flex items-start gap-3 cursor-pointer w-full">
                        <flow.icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-medium truncate">{flow.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {flow.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last modified: {flow.lastModified} -{" "}
                            <span
                              className={
                                flow.status === "Published"
                                  ? "text-green-600"
                                  : flow.status === "Draft"
                                  ? "text-yellow-600"
                                  : "text-muted-foreground"
                              }
                            >
                              {flow.status}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 self-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditFlowDetailsDialog(flow);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </ScrollArea>
            <CardFooter className="p-2 border-t">
              <Button variant="outline" className="w-full text-sm">
                <FileText className="mr-2 h-4 w-4" /> Browse Templates
              </Button>
            </CardFooter>
          </Card>

          <div
            className="bg-muted/50 flex-1 overflow-auto p-6 relative"
            ref={reactFlowWrapper}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedFlow?.name || "No Flow Selected"}
                </h2>
                {selectedFlow && (
                  <p className="text-sm text-muted-foreground">
                    Status: {selectedFlow.status} - Last Saved:{" "}
                    {selectedFlow.lastModified}
                  </p>
                )}
                {!selectedFlow && (
                  <p className="text-sm text-muted-foreground">
                    Select a flow from the left panel or create a new one.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={!selectedFlow}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" disabled={!selectedFlow}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!selectedFlow}
                  onClick={handleSaveAndPublish}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Save & Publish
                </Button>
                <AlertDialog
                  open={isDeleteFlowConfirmOpen}
                  onOpenChange={setIsDeleteFlowConfirmOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={!selectedFlow}
                      onClick={() =>
                        selectedFlow &&
                        triggerDeleteFlowConfirmation(selectedFlow)
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Flow
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete this flow?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the flow "{flowToDelete?.name || "this flow"}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setFlowToDelete(null)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmDeleteFlow}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Delete Flow
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                  <CardTitle className="text-lg">
                    Edit: {selectedNodeForEdit.data.label || "Node"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNodeEditorClose}
                    className="h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="p-3 space-y-4">
                    <div>
                      <Label
                        htmlFor="nodeId"
                        className="text-xs text-muted-foreground"
                      >
                        Node ID
                      </Label>
                      <Input
                        id="nodeId"
                        readOnly
                        value={selectedNodeForEdit.id}
                        className="mt-1 h-8 bg-muted/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nodeLabel" className="text-xs">
                        Label
                      </Label>
                      <Input
                        id="nodeLabel"
                        value={selectedNodeForEdit.data.label || ""}
                        onChange={(e) =>
                          handleNodeDataChange({ label: e.target.value })
                        }
                        className="mt-1 h-8"
                      />
                    </div>

                    {selectedNodeForEdit.type === "text" && (
                      <div className="mt-2 pt-2 border-t">
                        <Label htmlFor="nodeMessageText">Message Text</Label>
                        <Textarea
                          id="nodeMessageText"
                          value={selectedNodeForEdit.data.messageText || ""}
                          onChange={(e) =>
                            handleNodeDataChange({
                              messageText: e.target.value,
                            })
                          }
                          placeholder="Enter message to send..."
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    )}

                    {selectedNodeForEdit.type === "image" && (
                      <div className="space-y-3 mt-2 pt-2 border-t">
                        <div>
                          <Label htmlFor="nodeImageUrl">Image URL</Label>
                          <Input
                            id="nodeImageUrl"
                            value={selectedNodeForEdit.data.imageUrl || ""}
                            onChange={(e) =>
                              handleNodeDataChange({ imageUrl: e.target.value })
                            }
                            placeholder="https://example.com/image.png"
                            className="mt-1 h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nodeImageAltText">
                            Alt Text (Optional)
                          </Label>
                          <Input
                            id="nodeImageAltText"
                            value={selectedNodeForEdit.data.altText || ""}
                            onChange={(e) =>
                              handleNodeDataChange({ altText: e.target.value })
                            }
                            placeholder="Descriptive text for the image"
                            className="mt-1 h-8"
                          />
                        </div>
                      </div>
                    )}

                    {selectedNodeForEdit.type === "buttons" && (
                      <div className="space-y-3 mt-2 pt-2 border-t">
                        <div>
                          <Label htmlFor="buttonsNodeMessageText">
                            Message Text (Optional)
                          </Label>
                          <Textarea
                            id="buttonsNodeMessageText"
                            value={selectedNodeForEdit.data.messageText || ""}
                            onChange={(e) =>
                              handleNodeDataChange({
                                messageText: e.target.value,
                              })
                            }
                            placeholder="Enter a message to display with buttons..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <Label>Buttons</Label>
                        {selectedNodeForEdit.data.buttons?.map(
                          (
                            button: {
                              id: string;
                              label: string;
                              payload: string;
                            },
                            index: number
                          ) => (
                            <Card
                              key={button.id}
                              className="p-2 space-y-1 bg-muted/50"
                            >
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-medium">
                                  Button {index + 1}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => removeChoiceButton(button.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                              <div>
                                <Label
                                  htmlFor={`buttonLabel-${button.id}`}
                                  className="text-xs"
                                >
                                  Label
                                </Label>
                                <Input
                                  id={`buttonLabel-${button.id}`}
                                  value={button.label}
                                  onChange={(e) =>
                                    handleButtonChange(
                                      index,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Button Text"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`buttonPayload-${button.id}`}
                                  className="text-xs"
                                >
                                  Payload
                                </Label>
                                <Input
                                  id={`buttonPayload-${button.id}`}
                                  value={button.payload}
                                  onChange={(e) =>
                                    handleButtonChange(
                                      index,
                                      "payload",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Action or Value"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </Card>
                          )
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addChoiceButton}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Button
                        </Button>
                      </div>
                    )}

                    {selectedNodeForEdit.type === "userInput" && (
                      <div className="space-y-3 mt-2 pt-2 border-t">
                        <div>
                          <Label htmlFor="userInputPromptText">
                            Prompt Text
                          </Label>
                          <Textarea
                            id="userInputPromptText"
                            value={selectedNodeForEdit.data.promptText || ""}
                            onChange={(e) =>
                              handleNodeDataChange({
                                promptText: e.target.value,
                              })
                            }
                            placeholder="What question to ask the user?"
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="userInputVarName">
                            Variable Name (Optional)
                          </Label>
                          <Input
                            id="userInputVarName"
                            value={selectedNodeForEdit.data.variableName || ""}
                            onChange={(e) =>
                              handleNodeDataChange({
                                variableName: e.target.value,
                              })
                            }
                            placeholder="e.g., user_email"
                            className="mt-1 h-8"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Store user's reply in this variable.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNodeForEdit.type === "condition" && (
                      <div className="space-y-3 mt-2 pt-2 border-t">
                        <div>
                          <Label htmlFor="conditionVariable">
                            Variable Name
                          </Label>
                          <Input
                            id="conditionVariable"
                            value={selectedNodeForEdit.data.variable || ""}
                            onChange={(e) =>
                              handleNodeDataChange({ variable: e.target.value })
                            }
                            placeholder="e.g., user_email or last_message"
                            className="mt-1 h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor="conditionOperator">Operator</Label>
                          <Select
                            value={
                              selectedNodeForEdit.data.operator || "equals"
                            }
                            onValueChange={(value) =>
                              handleNodeDataChange({ operator: value })
                            }
                          >
                            <SelectTrigger
                              id="conditionOperator"
                              className="mt-1 h-8"
                            >
                              <SelectValue placeholder="Select operator" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="not_equals">
                                Not Equals
                              </SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="starts_with">
                                Starts With
                              </SelectItem>
                              <SelectItem value="ends_with">
                                Ends With
                              </SelectItem>
                              <SelectItem value="is_set">
                                Is Set (Exists)
                              </SelectItem>
                              <SelectItem value="is_not_set">
                                Is Not Set
                              </SelectItem>
                              <SelectItem value="greater_than">
                                Greater Than (Numeric)
                              </SelectItem>
                              <SelectItem value="less_than">
                                Less Than (Numeric)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="conditionValue">
                            Value to Compare
                          </Label>
                          <Input
                            id="conditionValue"
                            value={selectedNodeForEdit.data.value || ""}
                            onChange={(e) =>
                              handleNodeDataChange({ value: e.target.value })
                            }
                            placeholder="Value for comparison"
                            className="mt-1 h-8"
                          />
                        </div>
                      </div>
                    )}

                    {selectedNodeForEdit.type === "action" && (
                      <div className="space-y-3 mt-2 pt-2 border-t">
                        <div>
                          <Label htmlFor="actionType">Action Type</Label>
                          <Select
                            value={
                              selectedNodeForEdit.data.actionType || "api_call"
                            }
                            onValueChange={(value) =>
                              handleNodeDataChange({ actionType: value })
                            }
                          >
                            <SelectTrigger id="actionType" className="mt-1 h-8">
                              <SelectValue placeholder="Select action type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="api_call">API Call</SelectItem>
                              <SelectItem value="set_variable">
                                Set Variable
                              </SelectItem>
                              <SelectItem value="assign_agent">
                                Assign to Agent
                              </SelectItem>
                              <SelectItem value="add_tag">Add Tag</SelectItem>
                              <SelectItem value="send_email">
                                Send Email
                              </SelectItem>
                              <SelectItem value="end_flow">End Flow</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="actionParams">
                            Action Parameters (JSON)
                          </Label>
                          <Textarea
                            id="actionParams"
                            value={selectedNodeForEdit.data.actionParams || ""}
                            onChange={(e) =>
                              handleNodeDataChange({
                                actionParams: e.target.value,
                              })
                            }
                            placeholder='e.g., {"url": "...", "variable": "name", "value": "John"}'
                            className="mt-1 font-mono text-xs"
                            rows={4}
                          />
                        </div>
                      </div>
                    )}

                    {selectedNodeForEdit.type === "carousel" && (
                      <div className="mt-2 pt-2 border-t">
                        <Label htmlFor="nodeCarouselConfig">
                          Carousel Configuration (JSON)
                        </Label>
                        <Textarea
                          id="nodeCarouselConfig"
                          value={
                            selectedNodeForEdit.data.carouselConfigText || ""
                          }
                          onChange={(e) =>
                            handleNodeDataChange({
                              carouselConfigText: e.target.value,
                            })
                          }
                          placeholder='Example: [{"title": "Card 1", "subtitle": "Desc...", "imageUrl": "url", "buttons": [{"label": "More", "payload": "more_1"}]}]'
                          className="mt-1 font-mono text-xs"
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Define carousel items as a JSON array. Each item can
                          have title, subtitle, imageUrl, and buttons.
                        </p>
                      </div>
                    )}

                    {(selectedNodeForEdit.type === "input" ||
                      selectedNodeForEdit.type === "output") && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground mt-2">
                          Input and Output nodes typically only require a label
                          for identification.
                        </p>
                      </div>
                    )}

                    {![
                      "input",
                      "output",
                      "text",
                      "image",
                      "buttons",
                      "userInput",
                      "condition",
                      "action",
                      "carousel",
                    ].includes(selectedNodeForEdit.type || "default") && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Type: {selectedNodeForEdit.type || "default"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Specific editing options for this node type ('
                          {selectedNodeForEdit.type}') are not yet implemented.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </ScrollArea>
                <CardFooter className="p-3 border-t flex flex-col gap-2">
                  <Button onClick={handleNodeEditorClose} className="w-full">
                    Done Editing
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteNode}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Node
                  </Button>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="p-3 border-b">
                  <CardTitle className="text-lg">Node Palette</CardTitle>
                  <CardDescription className="text-xs">
                    Click to add to canvas. <br /> Ensure a flow is selected.
                  </CardDescription>
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
                          disabled={!selectedFlow}
                        >
                          <nodeTypeInfo.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium text-sm">
                              {nodeTypeInfo.label}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {nodeTypeInfo.description}
                            </p>
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

        <Dialog
          open={isEditFlowDetailsDialogOpen}
          onOpenChange={setIsEditFlowDetailsDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit Flow Details: {flowToEditDetails?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editFlowNameInput">Flow Name</Label>
                <Input
                  id="editFlowNameInput"
                  value={editFlowName}
                  onChange={(e) => setEditFlowName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editFlowDescriptionInput">Description</Label>
                <Textarea
                  id="editFlowDescriptionInput"
                  value={editFlowDescription}
                  onChange={(e) => setEditFlowDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setIsEditFlowDetailsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleSaveFlowDetails}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ReactFlowProvider>
  );
}
