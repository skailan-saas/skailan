
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, ClipboardCheck, CalendarDays, UserCircle, MoreHorizontal, GripVertical, Tag } from "lucide-react";
import { useState, type FC, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";

// Based on Prisma TaskStatus enum
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
    description: "Implementar endpoints para registro e inicio de sesión.",
    status: "EN_PROGRESO",
    dueDate: "2024-08-20",
    priority: "Alta",
    assignee: { name: "Carlos Ruiz", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "male face", avatarFallback: "CR" },
    tags: ["Backend", "API"],
  },
  {
    id: "task-3",
    title: "Investigación de mercado para Q4",
    description: "Analizar competidores y tendencias del mercado.",
    status: "PENDIENTE",
    dueDate: "2024-09-01",
    priority: "Media",
    assignee: { name: "Ana Torres", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman avatar", avatarFallback: "AT" },
    tags: ["Investigación"],
  },
  {
    id: "task-4",
    title: "Revisar feedback de usuarios",
    description: "Consolidar y analizar el feedback de la última encuesta.",
    status: "COMPLETADA",
    dueDate: "2024-07-30",
    priority: "Media",
    assignee: { name: "Laura Gómez", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "female face", avatarFallback: "LG" },
  },
  {
    id: "task-5",
    title: "Preparar presentación para inversores",
    status: "EN_PROGRESO",
    dueDate: "2024-08-25",
    priority: "Alta",
    assignee: { name: "David Lee", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "man face", avatarFallback: "DL"},
    tags: ["Estrategia", "Finanzas"]
  },
   {
    id: "task-6",
    title: "Actualizar documentación técnica",
    description: "Reflejar los últimos cambios en la API.",
    status: "ARCHIVADA",
    dueDate: "2024-07-15",
    assignee: { name: "Carlos Ruiz", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "male face", avatarFallback: "CR" },
    tags: ["Documentación"],
  },
];

const statusToColumnTitle: Record<TaskStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En Progreso",
  COMPLETADA: "Completada",
  ARCHIVADA: "Archivada",
};

interface TaskCardProps {
  task: Task;
}

const TaskCard: FC<TaskCardProps> = ({ task }) => {
  return (
    <Card className="mb-3 shadow-md hover:shadow-lg transition-shadow bg-card">
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-semibold leading-tight">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Task</DropdownMenuItem>
              <DropdownMenuItem>Assign</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {task.dueDate && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            <span>Vence: {task.dueDate}</span>
          </div>
        )}
        {task.priority && (
            <Badge 
                variant={task.priority === 'Alta' ? 'destructive' : task.priority === 'Media' ? 'secondary' : 'outline'} 
                className="text-xs mb-2"
            >
                Prioridad: {task.priority}
            </Badge>
        )}
        {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
                {task.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs flex items-center"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}
            </div>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} data-ai-hint={task.assignee.dataAiHint || "avatar person"} />
              <AvatarFallback className="text-xs">{task.assignee.avatarFallback}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
          </div>
        ) : <div />}
         <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
            <GripVertical className="h-4 w-4" />
             <span className="sr-only">Arrastrar tarea</span>
         </Button>
      </CardFooter>
    </Card>
  );
};


export default function CrmTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasksData);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  // Form state for adding task
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("PENDIENTE");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Media");
  const [newTaskAssigneeName, setNewTaskAssigneeName] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");


  const resetAddTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskStatus("PENDIENTE");
    setNewTaskDueDate("");
    setNewTaskPriority("Media");
    setNewTaskAssigneeName("");
    setNewTaskTags("");
  };

  const handleAddTaskSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
        toast({ title: "Task Title Required", description: "Please enter a title for the task.", variant: "destructive" });
        return;
    }
    const newId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newId,
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      status: newTaskStatus,
      dueDate: newTaskDueDate || undefined,
      priority: newTaskPriority || undefined,
      assignee: newTaskAssigneeName ? { name: newTaskAssigneeName, avatarUrl: `https://placehold.co/40x40.png?text=${newTaskAssigneeName[0]}`, avatarFallback: newTaskAssigneeName.substring(0,2).toUpperCase(), dataAiHint: "avatar person"} : undefined,
      tags: newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    
    console.log("New Task Data:", newTask);
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast({ title: "Task Added (Demo)", description: `Task "${newTask.title}" has been added.` });
    resetAddTaskForm();
    setIsAddTaskDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><ClipboardCheck className="mr-3 h-8 w-8 text-primary"/>Tasks Management</h1>
          <p className="text-muted-foreground">
            Organiza y haz seguimiento de las tareas de tu equipo en este tablero Kanban.
          </p>
        </div>
        <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsAddTaskDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>Enter the details for the new task.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTaskSubmit}>
                    <ScrollArea className="max-h-[60vh] p-1">
                        <div className="grid gap-4 py-4 pr-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="taskTitle" className="text-right col-span-1">Title</Label>
                                <Input id="taskTitle" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="e.g., Follow up with client" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="taskDescription" className="text-right col-span-1 pt-2">Description</Label>
                                <Textarea id="taskDescription" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Provide more details..." className="col-span-3" rows={3}/>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="taskStatus" className="text-right col-span-1">Status</Label>
                                <Select value={newTaskStatus} onValueChange={(value: TaskStatus) => setNewTaskStatus(value)}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        {TASK_STATUSES.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="taskDueDate" className="text-right col-span-1">Due Date</Label>
                                 <div className="col-span-3 relative">
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="taskDueDate" type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="pl-10" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="taskPriority" className="text-right col-span-1">Priority</Label>
                                <Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select priority" /></SelectTrigger>
                                    <SelectContent>
                                        {TASK_PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="taskAssignee" className="text-right col-span-1">Assignee</Label>
                                <Input id="taskAssignee" value={newTaskAssigneeName} onChange={(e) => setNewTaskAssigneeName(e.target.value)} placeholder="e.g., John Doe" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="taskTags" className="text-right col-span-1">Tags</Label>
                                <Input id="taskTags" value={newTaskTags} onChange={(e) => setNewTaskTags(e.target.value)} placeholder="e.g., urgent, client_x" className="col-span-3" />
                                <p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated tags.</p>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4 border-t">
                        <DialogClose asChild><Button type="button" variant="outline" onClick={resetAddTaskForm}>Cancel</Button></DialogClose>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Nota: La funcionalidad de arrastrar y soltar (Drag & Drop) para mover tareas entre columnas se implementará en un paso futuro.
      </p>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {TASK_STATUSES.map((statusKey) => (
            <Card key={statusKey} className="w-[300px] flex-shrink-0 flex flex-col bg-muted/40 shadow-md">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-md font-semibold flex justify-between items-center">
                  {statusToColumnTitle[statusKey]}
                  <Badge variant="secondary" className="text-xs">
                    {tasks.filter(task => task.status === statusKey).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="p-3">
                  {tasks.filter(task => task.status === statusKey).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No hay tareas en este estado.</p>
                  )}
                  {tasks
                    .filter(task => task.status === statusKey)
                    .map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                </CardContent>
              </ScrollArea>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

    