
"use client";

import React, { useState, type FC, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, ClipboardCheck, CalendarDays, MoreHorizontal, Tag, Eye, Edit, Trash2, Briefcase, Zap as OpportunityIcon } from "lucide-react"; // Added Briefcase, OpportunityIcon
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


// Aligned with prisma schema TaskStatus enum
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
type TaskStatus = typeof TASK_STATUSES[number];
// Aligned with prisma schema TaskPriority enum
const TASK_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
type TaskPriority = typeof TASK_PRIORITIES[number];

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  priority?: TaskPriority;
  assignee?: {
    name: string;
    avatarUrl: string;
    avatarFallback: string;
    dataAiHint?: string;
  };
  tags?: string[];
  opportunityId?: string;
  opportunityName?: string; // For display
  projectId?: string;
  projectName?: string; // For display
}

type TasksByStatus = {
  [key in TaskStatus]: Task[];
};

// Mock data for selection
const mockOpportunitiesForSelect: {id: string, name: string}[] = [
    {id: "opp-1", name: "Opportunity Alpha (Alice W.)"},
    {id: "opp-2", name: "Opportunity Beta (Bob T.)"},
];
const mockProjectsForSelect: {id: string, name: string}[] = [
    {id: "proj-1", name: "Lanzamiento App Móvil"},
    {id: "proj-3", name: "Campaña Marketing Q4"},
];


const initialTasksData: Task[] = [
  { id: "task-1", title: "Diseñar landing page", description: "Crear el diseño inicial para la nueva landing page del producto X.", status: "PENDING", dueDate: "2024-08-15", priority: "HIGH", assignee: { name: "Laura Gómez", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "female face", avatarFallback: "LG" }, tags: ["Diseño", "Web"], projectId: "proj-1", projectName: "Lanzamiento App Móvil" },
  { id: "task-2", title: "Desarrollar API de autenticación", status: "IN_PROGRESS", dueDate: "2024-08-20", priority: "HIGH", assignee: { name: "Carlos Ruiz", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "male face", avatarFallback: "CR" }, tags: ["Backend", "API"], opportunityId: "opp-1", opportunityName: "Opportunity Alpha (Alice W.)" },
  { id: "task-3", title: "Revisar feedback de usuarios", description: "Analizar los comentarios de la última encuesta y proponer mejoras.", status: "PENDING", dueDate: "2024-08-18", priority: "MEDIUM", assignee: { name: "Ana Torres", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman smiling", avatarFallback: "AT" }, tags: ["UX", "Investigación"], },
  { id: "task-4", title: "Actualizar documentación técnica", status: "COMPLETED", dueDate: "2024-07-30", priority: "LOW", tags: ["Documentación"], projectId: "proj-3", projectName: "Campaña Marketing Q4" },
];

const statusToColumnTitle: Record<TaskStatus, string> = {
  PENDING: "Pendiente", IN_PROGRESS: "En Progreso", COMPLETED: "Completada", ARCHIVED: "Archivada",
};
const priorityToDisplay: Record<TaskPriority, string> = {
  HIGH: "Alta", MEDIUM: "Media", LOW: "Baja",
};


const TaskFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(TASK_STATUSES, { required_error: "Status is required" }),
    dueDate: z.string().optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assigneeName: z.string().optional(), 
    tags: z.string().optional(), 
    opportunityId: z.string().optional(),
    projectId: z.string().optional(),
});
type TaskFormValues = z.infer<typeof TaskFormSchema>;

interface TaskCardProps {
  task: Task;
  index: number; 
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: FC<TaskCardProps> = React.memo(({ task, index, onEdit, onView, onDelete }) => {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
         <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            userSelect: "none", 
          }}
          className={cn(
            "p-3 rounded-lg border bg-card text-card-foreground mb-3 shadow-md hover:shadow-lg transition-shadow rbd-draggable-card",
            snapshot.isDragging && "shadow-xl opacity-80"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold leading-tight">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(task)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(task)}><Edit className="mr-2 h-4 w-4" /> Edit Task</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(task.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete Task</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 mb-2">{task.description}</p>}
          {task.dueDate && (<div className="flex items-center text-xs text-muted-foreground mb-2"><CalendarDays className="h-3.5 w-3.5 mr-1.5" /><span>Vence: {task.dueDate}</span></div>)}
          {task.priority && (<Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'secondary' : 'outline'} className="text-xs mb-2">Prioridad: {priorityToDisplay[task.priority]}</Badge>)}
          
          {(task.opportunityName || task.projectName) && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                {task.opportunityName && <><OpportunityIcon className="h-3 w-3 text-blue-500"/><span>{task.opportunityName}</span></>}
                {task.opportunityName && task.projectName && <span className="mx-1">/</span>}
                {task.projectName && <><Briefcase className="h-3 w-3 text-purple-500"/><span>{task.projectName}</span></>}
            </div>
          )}

          {task.tags && task.tags.length > 0 && (<div className="flex flex-wrap gap-1 mb-2">{task.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs flex items-center"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}</div>)}
          
          {task.assignee && (
            <div className="flex items-center gap-2 pt-2 border-t mt-2">
                <Avatar className="h-6 w-6"><AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} data-ai-hint={task.assignee.dataAiHint || "avatar person"}/><AvatarFallback className="text-xs">{task.assignee.avatarFallback}</AvatarFallback></Avatar>
                <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});
TaskCard.displayName = 'TaskCard';

interface TaskKanbanBoardProps {
  tasksByStatus: TasksByStatus;
  onDragEnd: (result: DropResult) => void;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskKanbanBoard: FC<TaskKanbanBoardProps> = ({ tasksByStatus, onDragEnd, onEditTask, onViewTask, onDeleteTask }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading board...</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {TASK_STATUSES.map((statusKey) => (
            <Droppable key={statusKey} droppableId={statusKey} type="TASK" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                      "w-[300px] flex-shrink-0 flex flex-col bg-muted/50 shadow-md rounded-lg min-h-[400px]",
                      snapshot.isDraggingOver && "bg-primary/10 border-primary"
                  )}
                >
                  <div className="p-4 border-b sticky top-0 bg-muted/60 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
                    <h3 className="text-md font-semibold">{statusToColumnTitle[statusKey]}</h3>
                    <Badge variant="secondary" className="text-xs">{(tasksByStatus[statusKey] || []).length}</Badge>
                  </div>
                  <div className="flex-1 p-3 pr-1 space-y-0 overflow-y-auto">
                    {(tasksByStatus[statusKey] || []).map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} onEdit={onEditTask} onView={onViewTask} onDelete={onDeleteTask} />
                    ))}
                    {provided.placeholder}
                    {(!tasksByStatus[statusKey] || tasksByStatus[statusKey].length === 0) && (<p className="text-xs text-muted-foreground text-center py-4">No hay tareas en este estado.</p>)}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};
TaskKanbanBoard.displayName = 'TaskKanbanBoard';


export default function CrmTasksPage() {
  const { toast } = useToast();
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>(() => {
    const initial: TasksByStatus = { PENDING: [], IN_PROGRESS: [], COMPLETED: [], ARCHIVED: [] };
    initialTasksData.forEach(task => {
      if (initial[task.status]) {
        initial[task.status].push(task);
      }
    });
    return initial;
  });

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const [isViewTaskDialogOpen, setIsViewTaskDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const addTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: { title: "", description: "", status: "PENDING", dueDate: "", priority: "MEDIUM", assigneeName: "", tags: "", opportunityId: "", projectId: "" },
  });

  const editTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
  });

  useEffect(() => {
    if (editingTask) {
        editTaskForm.reset({
            title: editingTask.title,
            description: editingTask.description || "",
            status: editingTask.status,
            dueDate: editingTask.dueDate || "",
            priority: editingTask.priority || "MEDIUM",
            assigneeName: editingTask.assignee?.name || "",
            tags: editingTask.tags?.join(", ") || "",
            opportunityId: editingTask.opportunityId || "",
            projectId: editingTask.projectId || "",
        });
    }
  }, [editingTask, editTaskForm]);


  const handleActualAddTaskSubmit = useCallback((values: TaskFormValues) => {
    const selectedOpp = mockOpportunitiesForSelect.find(o => o.id === values.opportunityId);
    const selectedProj = mockProjectsForSelect.find(p => p.id === values.projectId);

    const newTaskToAdd: Task = {
      id: `task-${Date.now()}`, title: values.title, description: values.description || undefined,
      status: values.status, dueDate: values.dueDate || undefined, priority: values.priority || undefined,
      assignee: values.assigneeName ? { name: values.assigneeName, avatarUrl: `https://placehold.co/40x40.png`, dataAiHint: "avatar person", avatarFallback: values.assigneeName.substring(0,2).toUpperCase()} : undefined,
      tags: values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag),
      opportunityId: values.opportunityId || undefined,
      opportunityName: selectedOpp?.name || undefined,
      projectId: values.projectId || undefined,
      projectName: selectedProj?.name || undefined,
    };
    setTasksByStatus(prev => {
        const newState = {...prev};
        newState[values.status] = [...(newState[values.status] || []), newTaskToAdd];
        return newState;
    });
    toast({ title: "Task Added", description: `Task "${newTaskToAdd.title}" added to ${statusToColumnTitle[values.status]}.` });
    addTaskForm.reset(); 
    setIsAddTaskDialogOpen(false);
  }, [toast, addTaskForm, setTasksByStatus]);

  const openEditTaskDialog = useCallback((task: Task) => {
    setEditingTask(task);
    setIsEditTaskDialogOpen(true);
  }, []);

  const openViewTaskDialog = useCallback((task: Task) => {
    setViewingTask(task);
    setIsViewTaskDialogOpen(true);
  }, []);


  const handleActualEditTaskSubmit = useCallback((values: TaskFormValues) => {
    if (!editingTask) return;
    const selectedOpp = mockOpportunitiesForSelect.find(o => o.id === values.opportunityId);
    const selectedProj = mockProjectsForSelect.find(p => p.id === values.projectId);

    const updatedTask: Task = {
      ...editingTask, title: values.title, description: values.description || undefined,
      status: values.status, dueDate: values.dueDate || undefined, priority: values.priority || undefined,
      assignee: values.assigneeName ? { name: values.assigneeName, avatarUrl: `https://placehold.co/40x40.png`, dataAiHint: "avatar person", avatarFallback: values.assigneeName.substring(0,2).toUpperCase()} : undefined,
      tags: values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag),
      opportunityId: values.opportunityId || undefined,
      opportunityName: selectedOpp?.name || undefined,
      projectId: values.projectId || undefined,
      projectName: selectedProj?.name || undefined,
    };

    setTasksByStatus(prev => {
      const newTasksByStatus = JSON.parse(JSON.stringify(prev)) as TasksByStatus; 
      const oldStatus = editingTask.status;
      const newStatus = updatedTask.status;

      newTasksByStatus[oldStatus] = (newTasksByStatus[oldStatus] || []).filter((t: Task) => t.id !== editingTask.id);
      newTasksByStatus[newStatus] = [...(newTasksByStatus[newStatus] || []), updatedTask];
      newTasksByStatus[newStatus].sort((a: Task, b: Task) => (initialTasksData.findIndex(t => t.id === a.id) - initialTasksData.findIndex(t => t.id === b.id)));

      return newTasksByStatus;
    });

    toast({ title: "Task Updated", description: `Task "${updatedTask.title}" updated.` });
    setIsEditTaskDialogOpen(false); setEditingTask(null);
  }, [editingTask, toast, setTasksByStatus]);

  const triggerDeleteConfirmation = useCallback((taskId: string) => {
    setTaskToDeleteId(taskId);
    setIsDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteTask = useCallback(() => {
    if (!taskToDeleteId) return;
    let taskNameToDelete = "Task";
    setTasksByStatus(prev => {
      const newTasksByStatus = JSON.parse(JSON.stringify(prev)) as TasksByStatus;
      for (const status of TASK_STATUSES) {
        const list = newTasksByStatus[status] || [];
        const taskIndex = list.findIndex((t: Task) => t.id === taskToDeleteId);
        if (taskIndex > -1) {
          taskNameToDelete = list[taskIndex].title;
          newTasksByStatus[status] = list.filter((p: Task) => p.id !== taskToDeleteId);
          break;
        }
      }
      return newTasksByStatus;
    });
    toast({ title: "Task Deleted", description: `Task "${taskNameToDelete}" removed.` });
    setIsDeleteConfirmOpen(false);
    setTaskToDeleteId(null);
  }, [taskToDeleteId, toast, setTasksByStatus]);

  
  const onDragEndTasks = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    setTasksByStatus((prev) => {
        const newTasksByStatus = { ...prev };
        const sourceTasks = Array.from(newTasksByStatus[sourceStatus] || []);
        const destTasks = sourceStatus === destStatus ? sourceTasks : Array.from(newTasksByStatus[destStatus] || []);
        
        const [movedTaskOriginal] = sourceTasks.splice(source.index, 1);
        if (!movedTaskOriginal) return prev; 

        if (sourceStatus === destStatus) {
            destTasks.splice(destination.index, 0, movedTaskOriginal);
            newTasksByStatus[sourceStatus] = destTasks;
            toast({ title: "Task Reordered", description: `Task "${movedTaskOriginal.title}" reordered.` });
        } else {
            const movedTaskCopy = { ...movedTaskOriginal, status: destStatus };
            destTasks.splice(destination.index, 0, movedTaskCopy);
            newTasksByStatus[sourceStatus] = sourceTasks;
            newTasksByStatus[destStatus] = destTasks;
            toast({ title: "Task Status Updated", description: `Task "${movedTaskOriginal.title}" moved to ${statusToColumnTitle[destStatus]}.` });
        }
        return newTasksByStatus;
    });
  }, [toast, setTasksByStatus]);
  

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><ClipboardCheck className="mr-3 h-8 w-8 text-primary"/>Tasks Management</h1>
          <p className="text-muted-foreground">Organiza y haz seguimiento de las tareas.</p>
        </div>
        <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {addTaskForm.reset(); setIsAddTaskDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Add New Task</DialogTitle><DialogDescription>Enter task details.</DialogDescription></DialogHeader>
            <FormProvider {...addTaskForm}>
            <form onSubmit={addTaskForm.handleSubmit(handleActualAddTaskSubmit)}>
              <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={addTaskForm.control} name="title" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Title</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., Follow up with client" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="description" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea placeholder="Provide details..." {...field} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{TASK_STATUSES.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="dueDate" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Due Date</FormLabel><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="date" className="pl-10" {...field} /></FormControl></div></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="priority" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent>{TASK_PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priorityToDisplay[priority]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="assigneeName" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Assignee</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., John Doe" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="tags" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Tags</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., urgent, client_x" {...field} /></FormControl></div><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated tags.</p><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="opportunityId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Opportunity</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to opportunity" /></SelectTrigger></FormControl><SelectContent>{mockOpportunitiesForSelect.map(opp => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="projectId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Project</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to project" /></SelectTrigger></FormControl><SelectContent>{mockProjectsForSelect.map(proj => <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addTaskForm.formState.isSubmitting}>Save Task</Button></DialogFooter>
            </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={(isOpen) => {
          setIsEditTaskDialogOpen(isOpen);
          if (!isOpen) setEditingTask(null);
      }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Edit Task: {editingTask?.title}</DialogTitle><DialogDescription>Update task details.</DialogDescription></DialogHeader>
          {editingTask && (
            <FormProvider {...editTaskForm}>
            <form onSubmit={editTaskForm.handleSubmit(handleActualEditTaskSubmit)}>
              <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                    <FormField control={editTaskForm.control} name="title" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Title</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="description" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea {...field} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{TASK_STATUSES.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="dueDate" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Due Date</FormLabel><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="date" className="pl-10" {...field} /></FormControl></div></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="priority" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{TASK_PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priorityToDisplay[priority]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="assigneeName" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Assignee</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="tags" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Tags</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated tags.</p><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="opportunityId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Opportunity</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to opportunity" /></SelectTrigger></FormControl><SelectContent>{mockOpportunitiesForSelect.map(opp => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="projectId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Project</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to project" /></SelectTrigger></FormControl><SelectContent>{mockProjectsForSelect.map(proj => <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editTaskForm.formState.isSubmitting}>Save Changes</Button></DialogFooter>
            </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>
      
      {/* View Task Dialog */}
      <Dialog open={isViewTaskDialogOpen} onOpenChange={setIsViewTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task Details: {viewingTask?.title}</DialogTitle>
            <DialogDescription>Read-only view of the task information.</DialogDescription>
          </DialogHeader>
          {viewingTask && (
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-3 py-4 text-sm">
              <div><p className="font-medium text-muted-foreground">Title:</p><p>{viewingTask.title}</p></div>
              {viewingTask.description && (<div><p className="font-medium text-muted-foreground">Description:</p><p className="whitespace-pre-wrap">{viewingTask.description}</p></div>)}
              <div><p className="font-medium text-muted-foreground">Status:</p><div><Badge variant="outline">{statusToColumnTitle[viewingTask.status]}</Badge></div></div>
              {viewingTask.dueDate && (<div><p className="font-medium text-muted-foreground">Due Date:</p><p>{viewingTask.dueDate}</p></div>)}
              {viewingTask.priority && (<div><p className="font-medium text-muted-foreground">Priority:</p><div><Badge variant={viewingTask.priority === 'HIGH' ? 'destructive' : viewingTask.priority === 'MEDIUM' ? 'secondary' : 'outline'}>{priorityToDisplay[viewingTask.priority]}</Badge></div></div>)}
              {viewingTask.assignee && (
                 <div><p className="font-medium text-muted-foreground">Assigned To:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-7 w-7"><AvatarImage src={viewingTask.assignee.avatarUrl} alt={viewingTask.assignee.name} data-ai-hint={viewingTask.assignee.dataAiHint || "avatar person"} /><AvatarFallback>{viewingTask.assignee.avatarFallback}</AvatarFallback></Avatar>
                    <span>{viewingTask.assignee.name}</span>
                  </div>
                </div>
              )}
              {viewingTask.opportunityName && (<div><p className="font-medium text-muted-foreground">Linked Opportunity:</p><div className="flex items-center gap-1"><OpportunityIcon className="h-4 w-4 text-blue-500"/><p>{viewingTask.opportunityName}</p></div></div>)}
              {viewingTask.projectName && (<div><p className="font-medium text-muted-foreground">Linked Project:</p><div className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-purple-500"/><p>{viewingTask.projectName}</p></div></div>)}
              {viewingTask.tags && viewingTask.tags.length > 0 && (
                <div><p className="font-medium text-muted-foreground">Tags:</p>
                  <div className="flex flex-wrap gap-1 mt-1">{viewingTask.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs flex items-center"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}</div>
                </div>
              )}
            </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete task 
              "{Object.values(tasksByStatus).flat().find(t => t.id === taskToDeleteId)?.title || 'this task'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setTaskToDeleteId(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskKanbanBoard
          tasksByStatus={tasksByStatus}
          onDragEnd={onDragEndTasks}
          onEditTask={openEditTaskDialog}
          onViewTask={openViewTaskDialog}
          onDeleteTask={triggerDeleteConfirmation}
      />
    </div>
  );
}


    