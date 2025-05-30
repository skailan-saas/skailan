
"use client";

import React, { useState, type FC, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Keep Card for TaskCard
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, ClipboardCheck, CalendarDays, MoreHorizontal, GripVertical, Tag, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCorners, useDraggable, useDroppable, type DragEndEvent, type Announcements } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

// Module-level constants
const TASK_STATUSES = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "ARCHIVADA"] as const;
type TaskStatus = typeof TASK_STATUSES[number];
const TASK_PRIORITIES = ["Alta", "Media", "Baja"] as const;
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
}

const initialTasksData: Task[] = [
  {
    id: "task-1",
    title: "Diseñar landing page",
    description: "Crear el diseño inicial para la nueva landing page del producto X.",
    status: "PENDIENTE",
    dueDate: "2024-08-15",
    priority: "Alta",
    assignee: { name: "Laura Gómez", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "female face", avatarFallback: "LG" },
    tags: ["Diseño", "Web"],
  },
  {
    id: "task-2",
    title: "Desarrollar API de autenticación",
    status: "EN_PROGRESO",
    dueDate: "2024-08-20",
    priority: "Alta",
    assignee: { name: "Carlos Ruiz", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "male face", avatarFallback: "CR" },
    tags: ["Backend", "API"],
  },
   {
    id: "task-3",
    title: "Revisar feedback de usuarios",
    description: "Analizar los comentarios de la última encuesta y proponer mejoras.",
    status: "PENDIENTE",
    dueDate: "2024-08-18",
    priority: "Media",
    assignee: { name: "Ana Torres", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman smiling", avatarFallback: "AT" },
    tags: ["UX", "Investigación"],
  },
  {
    id: "task-4",
    title: "Actualizar documentación técnica",
    status: "COMPLETADA",
    dueDate: "2024-07-30",
    priority: "Baja",
    tags: ["Documentación"],
  },
];

const statusToColumnTitle: Record<TaskStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En Progreso",
  COMPLETADA: "Completada",
  ARCHIVADA: "Archivada",
};

const customAnnouncements: Announcements = {
  onDragStart({ active }) { return `Picked up draggable item ${active.id}.`; },
  onDragOver({ active, over }) { return over ? `Draggable item ${active.id} was moved over droppable area ${over.id}.` : `Draggable item ${active.id} is no longer over a droppable area.`; },
  onDragEnd({ active, over }) { return over ? `Draggable item ${active.id} was dropped over droppable area ${over.id}` : `Draggable item ${active.id} was dropped.`; },
  onDragCancel({ active }) { return `Dragging was cancelled. Draggable item ${active.id} was dropped.`; },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: FC<TaskCardProps> = React.memo(({ task, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style: React.CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, touchAction: 'none' } : { touchAction: 'none' };

  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("rounded-lg border bg-card text-card-foreground mb-3 shadow-md hover:shadow-lg transition-shadow cursor-grab", isDragging && "opacity-60")}>
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-semibold leading-tight">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}><Eye className="mr-2 h-4 w-4" /> View/Edit Task</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(task.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete Task</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {task.dueDate && (<div className="flex items-center text-xs text-muted-foreground mb-2"><CalendarDays className="h-3.5 w-3.5 mr-1.5" /><span>Vence: {task.dueDate}</span></div>)}
        {task.priority && (<Badge variant={task.priority === 'Alta' ? 'destructive' : task.priority === 'Media' ? 'secondary' : 'outline'} className="text-xs mb-2">Prioridad: {task.priority}</Badge>)}
        {task.tags && task.tags.length > 0 && (<div className="flex flex-wrap gap-1 mb-2">{task.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs flex items-center"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}</div>)}
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        {task.assignee ? (<div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} data-ai-hint={task.assignee.dataAiHint || "avatar person"}/><AvatarFallback className="text-xs">{task.assignee.avatarFallback}</AvatarFallback></Avatar><span className="text-xs text-muted-foreground">{task.assignee.name}</span></div>) : <div />}
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100"><GripVertical className="h-4 w-4" /><span className="sr-only">Arrastrar tarea</span></Button>
      </CardFooter>
    </Card>
  );
});
TaskCard.displayName = 'TaskCard';

interface TaskKanbanBoardProps {
  tasks: Task[];
  statuses: readonly TaskStatus[];
  handleTaskDragEnd: (event: DragEndEvent) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskKanbanBoard: FC<TaskKanbanBoardProps> = ({ tasks, statuses, handleTaskDragEnd, onEditTask, onDeleteTask }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleTaskDragEnd} announcements={customAnnouncements}>
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {statuses.map((statusKey) => {
            const { isOver, setNodeRef: setDroppableRef } = useDroppable({ id: statusKey });
            const columnTasks = tasks.filter(task => task.status === statusKey);
            return (
              <div 
                key={statusKey} 
                ref={setDroppableRef} 
                className={cn(
                  "w-[300px] flex-shrink-0 flex flex-col bg-muted/50 shadow-md rounded-lg transition-colors duration-200 min-h-[400px] p-0", // p-0 on the main droppable div
                  isOver && "bg-primary/10 border-2 border-primary"
                )}
              >
                <div className="p-4 border-b sticky top-0 bg-muted/60 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
                  <h3 className="text-md font-semibold">{statusToColumnTitle[statusKey]}</h3>
                  <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
                </div>
                {/* This inner div handles the scroll and padding for tasks */}
                <div className="flex-1 p-3 pr-1 space-y-3 overflow-y-auto"> 
                  {columnTasks.length === 0 && (<p className="text-xs text-muted-foreground text-center py-4">No hay tareas en este estado.</p>)}
                  {columnTasks.map(task => (<TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
};

export default function CrmTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasksData);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("PENDIENTE");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Media");
  const [newTaskAssigneeName, setNewTaskAssigneeName] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");

  const [editFormTaskTitle, setEditFormTaskTitle] = useState("");
  const [editFormTaskDescription, setEditFormTaskDescription] = useState("");
  const [editFormTaskStatus, setEditFormTaskStatus] = useState<TaskStatus>("PENDIENTE");
  const [editFormTaskDueDate, setEditFormTaskDueDate] = useState("");
  const [editFormTaskPriority, setEditFormTaskPriority] = useState<TaskPriority>("Media");
  const [editFormTaskAssigneeName, setEditFormTaskAssigneeName] = useState("");
  const [editFormTaskTags, setEditFormTaskTags] = useState("");

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const resetAddTaskForm = useCallback(() => {
    setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskStatus("PENDIENTE");
    setNewTaskDueDate(""); setNewTaskPriority("Media"); setNewTaskAssigneeName(""); setNewTaskTags("");
  }, []);

  const handleAddTaskSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) { toast({ title: "Task Title Required", description: "Please enter a title.", variant: "destructive" }); return; }
    const newTaskToAdd: Task = {
      id: `task-${Date.now()}`, title: newTaskTitle, description: newTaskDescription || undefined,
      status: newTaskStatus, dueDate: newTaskDueDate || undefined, priority: newTaskPriority || undefined,
      assignee: newTaskAssigneeName ? { name: newTaskAssigneeName, avatarUrl: `https://placehold.co/40x40.png?text=${newTaskAssigneeName[0]}`, dataAiHint: "avatar person", avatarFallback: newTaskAssigneeName.substring(0,2).toUpperCase()} : undefined,
      tags: newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    setTasks(prevTasks => [...prevTasks, newTaskToAdd]);
    toast({ title: "Task Added", description: `Task "${newTaskToAdd.title}" added.` });
    resetAddTaskForm(); setIsAddTaskDialogOpen(false);
  }, [newTaskTitle, newTaskDescription, newTaskStatus, newTaskDueDate, newTaskPriority, newTaskAssigneeName, newTaskTags, resetAddTaskForm, toast]);

  const openEditTaskDialog = useCallback((task: Task) => {
    setEditingTask(task);
    setEditFormTaskTitle(task.title); setEditFormTaskDescription(task.description || "");
    setEditFormTaskStatus(task.status); setEditFormTaskDueDate(task.dueDate || "");
    setEditFormTaskPriority(task.priority || "Media"); setEditFormTaskAssigneeName(task.assignee?.name || "");
    setEditFormTaskTags(task.tags?.join(", ") || "");
    setIsEditTaskDialogOpen(true);
  }, []);

  const handleEditTaskSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask || !editFormTaskTitle.trim()) { toast({ title: "Task Title Required", description: "Please enter a title.", variant: "destructive" }); return; }
    const updatedTask: Task = {
      ...editingTask, title: editFormTaskTitle, description: editFormTaskDescription || undefined,
      status: editFormTaskStatus, dueDate: editFormTaskDueDate || undefined, priority: editFormTaskPriority || undefined,
      assignee: editFormTaskAssigneeName ? { name: editFormTaskAssigneeName, avatarUrl: `https://placehold.co/40x40.png?text=${editFormTaskAssigneeName[0]}`, dataAiHint: "avatar person", avatarFallback: editFormTaskAssigneeName.substring(0,2).toUpperCase()} : undefined,
      tags: editFormTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    setTasks(prevTasks => prevTasks.map(t => t.id === editingTask.id ? updatedTask : t));
    toast({ title: "Task Updated", description: `Task "${updatedTask.title}" updated.` });
    setIsEditTaskDialogOpen(false); setEditingTask(null);
  }, [editingTask, editFormTaskTitle, editFormTaskDescription, editFormTaskStatus, editFormTaskDueDate, editFormTaskPriority, editFormTaskAssigneeName, editFormTaskTags, toast]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast({ title: "Task Deleted (Demo)", description: "Task removed." });
  }, [toast]);
  
  const handleTaskDragEnd = useCallback((event: DragEndEvent) => {
    console.log("DragEnd Event:", JSON.parse(JSON.stringify(event)));
    const { active, over } = event;
    console.log("Active ID:", active.id as string);
    console.log("Over ID:", over ? over.id as string : null);

    if (!over) { 
      console.log("Drag ended but no valid 'over' target.");
      return; 
    }

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;
    
    const taskToMove = tasks.find(t => t.id === taskId);

    if (taskToMove && taskToMove.status !== targetStatus) {
      console.log(`Attempting to move task ${taskId} to status ${targetStatus}`);
      const updatedTask = { ...taskToMove, status: targetStatus };
      setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      toast({ title: "Task Status Updated", description: `Task "${taskToMove.title}" moved to ${statusToColumnTitle[targetStatus]}.`});
    } else {
       console.log(`Task ${taskId} not moved. Current status: ${taskToMove?.status}, target status: ${targetStatus}.`);
    }
  }, [tasks, toast]); // setTasks was missing from dependency array, added it for correctness though not the root cause here.

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><ClipboardCheck className="mr-3 h-8 w-8 text-primary"/>Tasks Management</h1>
          <p className="text-muted-foreground">Organiza y haz seguimiento de las tareas.</p>
        </div>
        <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Add New Task</DialogTitle><DialogDescription>Enter task details.</DialogDescription></DialogHeader>
            <form onSubmit={handleAddTaskSubmit}>
              <div className="max-h-[60vh] overflow-y-auto p-1">
                <div className="grid gap-4 py-4 pr-4">
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newTaskTitle" className="text-right col-span-1">Title</Label><Input id="newTaskTitle" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="e.g., Follow up with client" className="col-span-3" required /></div>
                  <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="newTaskDescription" className="text-right col-span-1 pt-2">Description</Label><Textarea id="newTaskDescription" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Provide details..." className="col-span-3" rows={3}/></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newTaskStatus" className="text-right col-span-1">Status</Label><Select value={newTaskStatus} onValueChange={(value: TaskStatus) => setNewTaskStatus(value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{TASK_STATUSES.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newTaskDueDate" className="text-right col-span-1">Due Date</Label><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="newTaskDueDate" type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="pl-10" /></div></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newTaskPriority" className="text-right col-span-1">Priority</Label><Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent>{TASK_PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newTaskAssigneeName" className="text-right col-span-1">Assignee</Label><Input id="newTaskAssigneeName" value={newTaskAssigneeName} onChange={(e) => setNewTaskAssigneeName(e.target.value)} placeholder="e.g., John Doe" className="col-span-3" /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newTaskTags" className="text-right col-span-1">Tags</Label><Input id="newTaskTags" value={newTaskTags} onChange={(e) => setNewTaskTags(e.target.value)} placeholder="e.g., urgent, client_x" className="col-span-3" /><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated tags.</p></div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline" onClick={resetAddTaskForm}>Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Task</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Edit Task: {editingTask?.title}</DialogTitle><DialogDescription>Update task details.</DialogDescription></DialogHeader>
          <form onSubmit={handleEditTaskSubmit}>
            <div className="max-h-[60vh] overflow-y-auto p-1">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormTaskTitle" className="text-right col-span-1">Title</Label><Input id="editFormTaskTitle" value={editFormTaskTitle} onChange={(e) => setEditFormTaskTitle(e.target.value)} className="col-span-3" required /></div>
                <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="editFormTaskDescription" className="text-right col-span-1 pt-2">Description</Label><Textarea id="editFormTaskDescription" value={editFormTaskDescription} onChange={(e) => setEditFormTaskDescription(e.target.value)} className="col-span-3" rows={3}/></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormTaskStatus" className="text-right col-span-1">Status</Label><Select value={editFormTaskStatus} onValueChange={(value: TaskStatus) => setEditFormTaskStatus(value)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent>{TASK_STATUSES.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormTaskDueDate" className="text-right col-span-1">Due Date</Label><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="editFormTaskDueDate" type="date" value={editFormTaskDueDate} onChange={(e) => setEditFormTaskDueDate(e.target.value)} className="pl-10" /></div></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormTaskPriority" className="text-right col-span-1">Priority</Label><Select value={editFormTaskPriority} onValueChange={(value: TaskPriority) => setEditFormTaskPriority(value)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent>{TASK_PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormTaskAssigneeName" className="text-right col-span-1">Assignee</Label><Input id="editFormTaskAssigneeName" value={editFormTaskAssigneeName} onChange={(e) => setEditFormTaskAssigneeName(e.target.value)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormTaskTags" className="text-right col-span-1">Tags</Label><Input id="editFormTaskTags" value={editFormTaskTags} onChange={(e) => setEditFormTaskTags(e.target.value)} className="col-span-3" /><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated tags.</p></div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsEditTaskDialogOpen(false)}>Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground flex-shrink-0">Arrastra las tareas entre columnas para cambiar su estado.</p>
      
      {isClient ? (
        <TaskKanbanBoard 
            tasks={tasks} 
            statuses={TASK_STATUSES}
            handleTaskDragEnd={handleTaskDragEnd} 
            onEditTask={openEditTaskDialog} 
            onDeleteTask={handleDeleteTask} 
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading board...</div>
      )}
    </div>
  );
}
