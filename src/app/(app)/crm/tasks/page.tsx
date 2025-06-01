
"use client";

import React, { useState, type FC, useEffect, useCallback } from 'react';
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
import { PlusCircle, ClipboardCheck, CalendarDays, MoreHorizontal, Tag, Eye, Edit, Trash2, Briefcase, Zap as OpportunityIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { TaskStatus as PrismaTaskStatus, TaskPriority as PrismaTaskPriority } from '@prisma/client';
import { TaskFormSchema, type TaskFormValues, TaskStatusEnumClient, TaskPriorityEnumClient } from '@/lib/schemas/crm/task-schema';
import {
    getTasks, createTask, updateTask, deleteTask, updateTaskStatus,
    getUsersForTasks, getLeadsForTasks, getProjectsForTasks,
    type TaskFE
} from './actions';


type TasksByStatus = {
  [key in PrismaTaskStatus]: TaskFE[];
};

const statusToColumnTitle: Record<PrismaTaskStatus, string> = {
  PENDING: "Pendiente", IN_PROGRESS: "En Progreso", COMPLETED: "Completada", ARCHIVED: "Archivada",
};
const priorityToDisplayClient: Record<PrismaTaskPriority, string> = {
  HIGH: "Alta", MEDIUM: "Media", LOW: "Baja",
};

interface SelectOption { id: string; name: string | null; }

interface TaskCardProps {
  task: TaskFE;
  index: number;
  onEdit: (task: TaskFE) => void;
  onView: (task: TaskFE) => void;
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
          style={{ ...provided.draggableProps.style, userSelect: "none" }}
          className={cn(
            "p-3 rounded-lg border bg-card text-card-foreground mb-3 shadow-md hover:shadow-lg transition-shadow rbd-draggable-card",
            snapshot.isDragging && "shadow-xl opacity-80"
          )}
          data-ai-hint={task.dataAiHint || "task checkmark"}
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
          {task.dueDate && (<div className="flex items-center text-xs text-muted-foreground mb-2"><CalendarDays className="h-3.5 w-3.5 mr-1.5" /><span>Vence: {new Date(task.dueDate).toLocaleDateString()}</span></div>)}
          {task.priority && (<Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'secondary' : 'outline'} className="text-xs mb-2">Prioridad: {priorityToDisplayClient[task.priority]}</Badge>)}

          {(task.relatedToLead?.name || task.relatedToProject?.name) && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                {task.relatedToLead?.name && <><OpportunityIcon className="h-3 w-3 text-blue-500"/><span>{task.relatedToLead.name}</span></>}
                {task.relatedToLead?.name && task.relatedToProject?.name && <span className="mx-1">/</span>}
                {task.relatedToProject?.name && <><Briefcase className="h-3 w-3 text-purple-500"/><span>{task.relatedToProject.name}</span></>}
            </div>
          )}

          {task.tags && task.tags.length > 0 && (<div className="flex flex-wrap gap-1 mb-2">{task.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs flex items-center"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}</div>)}

          {task.assignedTo && (
            <div className="flex items-center gap-2 pt-2 border-t mt-2">
                <Avatar className="h-6 w-6"><AvatarImage src={task.assignedTo.avatarUrl || `https://placehold.co/40x40.png`} alt={task.assignedTo.name || 'U'} data-ai-hint={task.assignedTo.dataAiHint || "avatar person"}/><AvatarFallback className="text-xs">{(task.assignedTo.name || 'U').substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                <span className="text-xs text-muted-foreground">{task.assignedTo.name}</span>
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
  onEditTask: (task: TaskFE) => void;
  onViewTask: (task: TaskFE) => void;
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
          {TaskStatusEnumClient.options.map((statusKey) => (
            <Droppable key={statusKey} droppableId={statusKey} type="TASK">
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
                  <ScrollArea className="flex-1">
                  <div className="p-3 pr-1 space-y-0 ">
                    {(tasksByStatus[statusKey] || []).map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} onEdit={onEditTask} onView={onViewTask} onDelete={onDeleteTask} />
                    ))}
                    {provided.placeholder}
                    {(!tasksByStatus[statusKey] || tasksByStatus[statusKey].length === 0) && (<p className="text-xs text-muted-foreground text-center py-4">No hay tareas en este estado.</p>)}
                  </div>
                  </ScrollArea>
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
  const [isLoading, setIsLoading] = useState(true);
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>({ PENDING: [], IN_PROGRESS: [], COMPLETED: [], ARCHIVED: [] });

  const [usersForSelect, setUsersForSelect] = useState<SelectOption[]>([]);
  const [opportunitiesForSelect, setOpportunitiesForSelect] = useState<SelectOption[]>([]);
  const [projectsForSelect, setProjectsForSelect] = useState<SelectOption[]>([]);

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskFE | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const [isViewTaskDialogOpen, setIsViewTaskDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskFE | null>(null);

  const addTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: { title: "", description: "", status: "PENDING", dueDate: null, priority: "MEDIUM", assignedToUserId: null, tagNames: null, relatedToLeadId: null, relatedToProjectId: null },
  });

  const editTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
  });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedUsers, fetchedLeads, fetchedProjects] = await Promise.all([
        getTasks(), getUsersForTasks(), getLeadsForTasks(), getProjectsForTasks()
      ]);

      const initialStatusMap: TasksByStatus = { PENDING: [], IN_PROGRESS: [], COMPLETED: [], ARCHIVED: [] };
      fetchedTasks.forEach(task => {
        const statusKey = task.status; // PrismaTaskStatus
        if (initialStatusMap[statusKey]) {
            initialStatusMap[statusKey].push(task);
        } else { // Should not happen if initialStatusMap covers all PrismaTaskStatus
            initialStatusMap[statusKey] = [task];
        }
      });
      setTasksByStatus(initialStatusMap);
      setUsersForSelect(fetchedUsers);
      setOpportunitiesForSelect(fetchedLeads);
      setProjectsForSelect(fetchedProjects);

    } catch (error: any) {
      toast({ title: "Error fetching data", description: error.message || "Could not load tasks data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  useEffect(() => {
    if (editingTask) {
        editTaskForm.reset({
            title: editingTask.title,
            description: editingTask.description || null,
            status: editingTask.status,
            dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : null,
            priority: editingTask.priority || "MEDIUM",
            assignedToUserId: editingTask.assignedTo?.id || null,
            tagNames: editingTask.tags?.join(", ") || null,
            relatedToLeadId: editingTask.relatedToLead?.id || null,
            relatedToProjectId: editingTask.relatedToProject?.id || null,
        });
    }
  }, [editingTask, editTaskForm]);

  const refreshTasks = useCallback(async () => {
    // setIsLoading(true); // Optional: show loading indicator for refresh
    try {
        const fetchedTasks = await getTasks();
        const newStatusMap: TasksByStatus = { PENDING: [], IN_PROGRESS: [], COMPLETED: [], ARCHIVED: [] };
        fetchedTasks.forEach(task => {
            const statusKey = task.status;
            if (newStatusMap[statusKey]) {
                newStatusMap[statusKey].push(task);
            } else {
                 newStatusMap[statusKey] = [task];
            }
        });
        setTasksByStatus(newStatusMap);
    } catch (error: any) {
        toast({ title: "Error refreshing tasks", description: error.message || "Could not reload tasks.", variant: "destructive" });
    } finally {
        // setIsLoading(false);
    }
  }, [toast]);


  const handleActualAddTaskSubmit = async (values: TaskFormValues) => {
    try {
      addTaskForm.control._formState.isSubmitting = true;
      await createTask(values);
      toast({ title: "Task Added", description: `Task "${values.title}" added.` });
      addTaskForm.reset();
      setIsAddTaskDialogOpen(false);
      refreshTasks();
    } catch (error: any) {
        toast({ title: "Error Adding Task", description: error.message || "Could not add task.", variant: "destructive"});
    } finally {
        addTaskForm.control._formState.isSubmitting = false;
    }
  };

  const openEditTaskDialog = useCallback((task: TaskFE) => {
    setEditingTask(task);
    setIsEditTaskDialogOpen(true);
  }, []);

  const openViewTaskDialog = useCallback((task: TaskFE) => {
    setViewingTask(task);
    setIsViewTaskDialogOpen(true);
  }, []);


  const handleActualEditTaskSubmit = async (values: TaskFormValues) => {
    if (!editingTask) return;
    try {
      editTaskForm.control._formState.isSubmitting = true;
      await updateTask(editingTask.id, values);
      toast({ title: "Task Updated", description: `Task "${values.title}" updated.` });
      setIsEditTaskDialogOpen(false);
      setEditingTask(null);
      refreshTasks();
    } catch (error: any) {
        toast({ title: "Error Updating Task", description: error.message || "Could not update task.", variant: "destructive"});
    } finally {
        editTaskForm.control._formState.isSubmitting = false;
    }
  };

  const triggerDeleteConfirmation = useCallback((taskId: string) => {
    setTaskToDeleteId(taskId);
    setIsDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteTask = async () => {
    if (!taskToDeleteId) return;
    const taskToDelete = Object.values(tasksByStatus).flat().find(t => t.id === taskToDeleteId);
    try {
      const result = await deleteTask(taskToDeleteId);
       if (result.success) {
            toast({ title: "Task Deleted", description: `Task "${taskToDelete?.title || 'Task'}" marked as deleted.` });
            refreshTasks();
        } else {
            toast({ title: "Error Deleting Task", description: result.message || "Could not delete task.", variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Error Deleting Task", description: error.message || "An unexpected error occurred.", variant: "destructive"});
    }
    setIsDeleteConfirmOpen(false);
    setTaskToDeleteId(null);
  };


  const onDragEndTasks = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceStatus = source.droppableId as PrismaTaskStatus;
    const destStatus = destination.droppableId as PrismaTaskStatus;

    if (sourceStatus === destStatus && source.index === destination.index) {
      return; // No change
    }

    const newTasksByStatus = JSON.parse(JSON.stringify(tasksByStatus)) as TasksByStatus;
    const sourceList = newTasksByStatus[sourceStatus];
    const [movedTaskOriginal] = sourceList.splice(source.index, 1);

    if (!movedTaskOriginal) return;

    movedTaskOriginal.status = destStatus;
    const destList = newTasksByStatus[destStatus] || [];
    destList.splice(destination.index, 0, movedTaskOriginal);

    newTasksByStatus[sourceStatus] = sourceList;
    newTasksByStatus[destStatus] = destList;

    setTasksByStatus(newTasksByStatus); // Optimistic UI Update

    try {
        await updateTaskStatus(draggableId, destStatus);
        toast({ title: "Task Status Updated", description: `Task "${movedTaskOriginal.title}" moved to ${statusToColumnTitle[destStatus]}.` });
    } catch (error: any) {
        toast({ title: "Error Updating Status", description: error.message || "Could not update task status.", variant: "destructive" });
        refreshTasks(); // Revert optimistic update by re-fetching
    }
  };

  if (isLoading && !Object.values(tasksByStatus).flat().length) {
    return <div className="p-6 text-center text-muted-foreground">Loading tasks...</div>;
  }


  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><ClipboardCheck className="mr-3 h-8 w-8 text-primary"/>Tasks Management</h1>
          <p className="text-muted-foreground">Organiza y haz seguimiento de las tareas.</p>
        </div>
        <Dialog open={isAddTaskDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) addTaskForm.reset();
            setIsAddTaskDialogOpen(isOpen);
        }}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Add New Task</DialogTitle><DialogDescription>Enter task details.</DialogDescription></DialogHeader>
            <FormProvider {...addTaskForm}>
            <form onSubmit={addTaskForm.handleSubmit(handleActualAddTaskSubmit)}>
              <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={addTaskForm.control} name="title" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Title *</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., Follow up with client" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="description" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea placeholder="Provide details..." {...field} value={field.value ?? ""} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{TaskStatusEnumClient.options.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="dueDate" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Due Date</FormLabel><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="date" className="pl-10" {...field} value={field.value ?? ''} /></FormControl></div></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="priority" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Priority</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent>{TaskPriorityEnumClient.options.map(priority => <SelectItem key={priority} value={priority}>{priorityToDisplayClient[priority]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="assignedToUserId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Assignee</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Assign to user" /></SelectTrigger></FormControl><SelectContent>{usersForSelect.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="tagNames" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Tags</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., urgent, client_x (comma-separated)" {...field} value={field.value ?? ""} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="relatedToLeadId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Opportunity</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to opportunity" /></SelectTrigger></FormControl><SelectContent>{opportunitiesForSelect.map(opp => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addTaskForm.control} name="relatedToProjectId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Project</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to project" /></SelectTrigger></FormControl><SelectContent>{projectsForSelect.map(proj => <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addTaskForm.formState.isSubmitting}>{addTaskForm.formState.isSubmitting ? "Saving..." : "Save Task"}</Button></DialogFooter>
            </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditTaskDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) { setEditingTask(null); editTaskForm.reset(); }
          setIsEditTaskDialogOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Edit Task: {editingTask?.title}</DialogTitle><DialogDescription>Update task details.</DialogDescription></DialogHeader>
          {editingTask && (
            <FormProvider {...editTaskForm}>
            <form onSubmit={editTaskForm.handleSubmit(handleActualEditTaskSubmit)}>
              <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                    <FormField control={editTaskForm.control} name="title" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Title *</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="description" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea {...field} value={field.value ?? ""} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{TaskStatusEnumClient.options.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="dueDate" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Due Date</FormLabel><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="date" className="pl-10" {...field} value={field.value ?? ''} /></FormControl></div></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="priority" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Priority</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{TaskPriorityEnumClient.options.map(priority => <SelectItem key={priority} value={priority}>{priorityToDisplayClient[priority]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="assignedToUserId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Assignee</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Assign to user" /></SelectTrigger></FormControl><SelectContent>{usersForSelect.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="tagNames" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Tags</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., urgent, client_x (comma-separated)" {...field} value={field.value ?? ""} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="relatedToLeadId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Opportunity</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to opportunity" /></SelectTrigger></FormControl><SelectContent>{opportunitiesForSelect.map(opp => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                    <FormField control={editTaskForm.control} name="relatedToProjectId" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Project</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Link to project" /></SelectTrigger></FormControl><SelectContent>{projectsForSelect.map(proj => <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editTaskForm.formState.isSubmitting}>{editTaskForm.formState.isSubmitting ? "Saving..." : "Save Changes"}</Button></DialogFooter>
            </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>

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
              {viewingTask.dueDate && (<div><p className="font-medium text-muted-foreground">Due Date:</p><p>{new Date(viewingTask.dueDate).toLocaleDateString()}</p></div>)}
              {viewingTask.priority && (<div><p className="font-medium text-muted-foreground">Priority:</p><div><Badge variant={viewingTask.priority === 'HIGH' ? 'destructive' : viewingTask.priority === 'MEDIUM' ? 'secondary' : 'outline'}>{priorityToDisplayClient[viewingTask.priority]}</Badge></div></div>)}
              {viewingTask.assignedTo && (
                 <div><p className="font-medium text-muted-foreground">Assigned To:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-7 w-7"><AvatarImage src={viewingTask.assignedTo.avatarUrl || `https://placehold.co/40x40.png`} alt={viewingTask.assignedTo.name || 'U'} data-ai-hint={viewingTask.assignedTo.dataAiHint || "avatar person"} /><AvatarFallback className="text-xs">{(viewingTask.assignedTo.name || 'U').substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                    <span>{viewingTask.assignedTo.name}</span>
                  </div>
                </div>
              )}
              {viewingTask.relatedToLead?.name && (<div><p className="font-medium text-muted-foreground">Linked Opportunity:</p><div className="flex items-center gap-1"><OpportunityIcon className="h-4 w-4 text-blue-500"/><p>{viewingTask.relatedToLead.name}</p></div></div>)}
              {viewingTask.relatedToProject?.name && (<div><p className="font-medium text-muted-foreground">Linked Project:</p><div className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-purple-500"/><p>{viewingTask.relatedToProject.name}</p></div></div>)}
              {viewingTask.tags && viewingTask.tags.length > 0 && (
                <div><p className="font-medium text-muted-foreground">Tags:</p>
                  <div className="flex flex-wrap gap-1 mt-1">{viewingTask.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs flex items-center"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}</div>
                </div>
              )}
               <div><p className="font-medium text-muted-foreground">Created At:</p><p>{new Date(viewingTask.createdAt).toLocaleString()}</p></div>
               <div><p className="font-medium text-muted-foreground">Last Updated:</p><p>{new Date(viewingTask.updatedAt).toLocaleString()}</p></div>
            </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark task
              "{Object.values(tasksByStatus).flat().find(t => t.id === taskToDeleteId)?.title || 'this task'}" as deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setTaskToDeleteId(null); setIsDeleteConfirmOpen(false);}} type="button">Cancel</AlertDialogCancel>
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
       <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Showing {Object.values(tasksByStatus).flat().length} tasks.
      </div>
    </div>
  );
}
