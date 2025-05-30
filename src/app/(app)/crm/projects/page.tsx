
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
import { PlusCircle, Briefcase, CalendarDays, MoreHorizontal, Eye, Edit, Trash2, User, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import { ScrollArea } from '@/components/ui/scroll-area';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const PROJECT_STATUSES = ["PLANIFICACION", "ACTIVO", "COMPLETADO", "EN_ESPERA", "CANCELADO"] as const;
type ProjectStatus = typeof PROJECT_STATUSES[number];

interface ProjectTeamMember { name: string; avatarUrl: string; avatarFallback: string; dataAiHint?: string; }
interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  clientName?: string;
  team?: ProjectTeamMember[];
  progress?: number;
  deadline?: string;
  dataAiHint?: string;
}

type ProjectsByStatus = {
  [key in ProjectStatus]: Project[];
};

const initialProjectsData: Project[] = [
  { id: "proj-1", name: "Lanzamiento App Móvil", description: "Desarrollo y lanzamiento de la app móvil.", status: "ACTIVO", clientName: "Interno", team: [ { name: "Elena V.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", avatarFallback: "EV" }, { name: "Marco C.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "asian man", avatarFallback: "MC" } ], progress: 65, deadline: "2024-10-31", dataAiHint: "mobile app"},
  { id: "proj-2", name: "Integración CRM", status: "PLANIFICACION", clientName: "Cliente Alfa", progress: 10, deadline: "2024-11-15", dataAiHint: "crm system"},
  { id: "proj-3", name: "Campaña Marketing Q4", description: "Planificación y ejecución de la campaña de marketing para el último trimestre.", status: "ACTIVO", clientName: "Marketing Dept.", team: [ { name: "Sofia L.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "latina woman", avatarFallback: "SL" } ], progress: 30, deadline: "2024-12-15", dataAiHint: "marketing campaign"},
  { id: "proj-4", name: "Rediseño Web Corporativa", status: "COMPLETADO", clientName: "CEO Office", progress: 100, deadline: "2024-06-30", dataAiHint: "website design"},
];

const projectStatusToColumnTitle: Record<ProjectStatus, string> = {
  PLANIFICACION: "Planificación", ACTIVO: "Activo", COMPLETADO: "Completado", EN_ESPERA: "En Espera", CANCELADO: "Cancelado",
};

const ProjectFormSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    status: z.enum(PROJECT_STATUSES, { required_error: "Status is required" }),
    clientName: z.string().optional(),
    teamMembers: z.string().optional(), // Comma-separated names for now
    progress: z.coerce.number().min(0).max(100).optional(),
    deadline: z.string().optional(),
});
type ProjectFormValues = z.infer<typeof ProjectFormSchema>;


interface ProjectCardProps {
  project: Project;
  index: number;
  onEdit: (project: Project) => void;
  onView: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: FC<ProjectCardProps> = React.memo(({ project, index, onEdit, onView, onDelete }) => {
  return (
    <Draggable draggableId={String(project.id)} index={index}>
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
            <h4 className="text-sm font-semibold leading-tight">{project.name}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(project)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(project)}><Edit className="mr-2 h-4 w-4" /> Edit Project</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(project.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete Project</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 mb-2">{project.description}</p>}
          {project.clientName && <p className="text-xs text-muted-foreground mb-1">Cliente: <span className="font-medium text-foreground">{project.clientName}</span></p>}
          {project.deadline && <p className="text-xs text-muted-foreground flex items-center mb-1"><CalendarDays className="h-3.5 w-3.5 mr-1"/>Fecha Límite: {project.deadline}</p>}
          {project.team && project.team.length > 0 && (
            <div className="flex items-center -space-x-2 mb-2">
              {project.team.map(member => (<Avatar key={member.name} className="h-6 w-6 border-2 border-background"><AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.dataAiHint || "avatar person"}/><AvatarFallback className="text-xs">{member.avatarFallback}</AvatarFallback></Avatar>))}
              <span className="pl-3 text-xs text-muted-foreground">({project.team.length} {project.team.length === 1 ? 'miembro' : 'miembros'})</span>
            </div>
          )}
          {project.progress !== undefined && (
            <div>
                <div className="flex justify-between items-center mb-1"><p className="text-xs text-muted-foreground">Progreso:</p><p className="text-xs font-semibold text-primary">{project.progress}%</p></div>
                <Progress value={project.progress} className="h-2" />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});
ProjectCard.displayName = 'ProjectCard';

interface ProjectKanbanBoardProps {
  projectsByStatus: ProjectsByStatus;
  onDragEnd: (result: DropResult) => void;
  onEditProject: (project: Project) => void;
  onViewProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectKanbanBoard: FC<ProjectKanbanBoardProps> = ({ projectsByStatus, onDragEnd, onEditProject, onViewProject, onDeleteProject }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading board...</div>;
  }

  return (
     <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max h-full">
            {PROJECT_STATUSES.map((statusKey) => (
              <Droppable key={statusKey} droppableId={statusKey} type="PROJECT" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                        "w-[320px] flex-shrink-0 flex flex-col bg-muted/50 shadow-md rounded-lg min-h-[400px]",
                        snapshot.isDraggingOver && "bg-primary/10 border-primary"
                    )}
                  >
                    <div className="p-4 border-b sticky top-0 bg-muted/60 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
                      <h3 className="text-md font-semibold">{projectStatusToColumnTitle[statusKey]}</h3>
                      <Badge variant="secondary" className="text-xs">{(projectsByStatus[statusKey] || []).length}</Badge>
                    </div>
                    <div className="flex-1 p-3 pr-1 space-y-0 overflow-y-auto">
                      {(projectsByStatus[statusKey] || []).map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} onEdit={onEditProject} onView={onViewProject} onDelete={onDeleteProject} />
                      ))}
                      {provided.placeholder}
                      {(!projectsByStatus[statusKey] || projectsByStatus[statusKey].length === 0) && (<p className="text-xs text-muted-foreground text-center py-4">No hay proyectos en este estado.</p>)}
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
ProjectKanbanBoard.displayName = 'ProjectKanbanBoard';


export default function CrmProjectsPage() {
  const { toast } = useToast();
  const [projectsByStatus, setProjectsByStatus] = useState<ProjectsByStatus>(() => {
    const initial: ProjectsByStatus = { PLANIFICACION: [], ACTIVO: [], COMPLETADO: [], EN_ESPERA: [], CANCELADO: [] };
    initialProjectsData.forEach(project => {
      if (initial[project.status]) {
        initial[project.status].push(project);
      }
    });
    return initial;
  });

  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  const [isViewProjectDialogOpen, setIsViewProjectDialogOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const addProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: { name: "", description: "", status: "PLANIFICACION", clientName: "", teamMembers: "", progress: 0, deadline: "" },
  });

  const editProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema),
  });

  useEffect(() => {
    if (editingProject) {
        editProjectForm.reset({
            name: editingProject.name,
            description: editingProject.description || "",
            status: editingProject.status,
            clientName: editingProject.clientName || "",
            teamMembers: editingProject.team?.map(m => m.name).join(", ") || "",
            progress: editingProject.progress || 0,
            deadline: editingProject.deadline || "",
        });
    }
  }, [editingProject, editProjectForm]);

  const handleActualAddProjectSubmit = useCallback((values: ProjectFormValues) => {
    const teamMembers: ProjectTeamMember[] = values.teamMembers?.split(',').map(name => name.trim()).filter(name => name).map(name => ({ name, avatarUrl: `https://placehold.co/40x40.png`, dataAiHint: "avatar person", avatarFallback: name.substring(0,2).toUpperCase()})) || [];
    const newProjectToAdd: Project = {
      id: `proj-${Date.now()}`, name: values.name, description: values.description || undefined,
      status: values.status, clientName: values.clientName || undefined, team: teamMembers.length > 0 ? teamMembers : undefined,
      progress: values.progress, deadline: values.deadline || undefined, dataAiHint: "project folder",
    };
    setProjectsByStatus(prev => {
        const newState = {...prev};
        newState[values.status] = [...(newState[values.status] || []), newProjectToAdd];
        return newState;
    });
    toast({ title: "Project Added", description: `Project "${newProjectToAdd.name}" added.` });
    addProjectForm.reset(); 
    setIsAddProjectDialogOpen(false);
  }, [toast, addProjectForm, setProjectsByStatus]);

  const openEditProjectDialog = useCallback((project: Project) => {
    setEditingProject(project);
    setIsEditProjectDialogOpen(true);
  }, []);

  const openViewProjectDialog = useCallback((project: Project) => {
    setViewingProject(project);
    setIsViewProjectDialogOpen(true);
  }, []);

  const handleActualEditProjectSubmit = useCallback((values: ProjectFormValues) => {
    if (!editingProject) return;
    const teamMembers: ProjectTeamMember[] = values.teamMembers?.split(',').map(name => name.trim()).filter(name => name).map(name => ({ name, avatarUrl: `https://placehold.co/40x40.png`, dataAiHint: "avatar person", avatarFallback: name.substring(0,2).toUpperCase()})) || [];

    const updatedProject: Project = {
      ...editingProject, name: values.name, description: values.description || undefined,
      status: values.status, clientName: values.clientName || undefined, team: teamMembers.length > 0 ? teamMembers : undefined,
      progress: values.progress, deadline: values.deadline || undefined,
    };

    setProjectsByStatus(prev => {
      const newProjectsByStatus = JSON.parse(JSON.stringify(prev)) as ProjectsByStatus; 
      const oldStatus = editingProject.status;
      const newStatus = updatedProject.status;

      newProjectsByStatus[oldStatus] = (newProjectsByStatus[oldStatus] || []).filter((p: Project) => p.id !== editingProject.id);
      newProjectsByStatus[newStatus] = [...(newProjectsByStatus[newStatus] || []), updatedProject];
      newProjectsByStatus[newStatus].sort((a: Project, b: Project) => (initialProjectsData.findIndex(p => p.id === a.id) - initialProjectsData.findIndex(p => p.id === b.id)));
      return newProjectsByStatus;
    });

    toast({ title: "Project Updated", description: `Project "${updatedProject.name}" updated.` });
    setIsEditProjectDialogOpen(false); setEditingProject(null);
  }, [editingProject, toast, setProjectsByStatus]);

  const triggerDeleteConfirmation = useCallback((id: string) => {
    setProjectToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteProject = useCallback(() => {
    if (!projectToDeleteId) return;
    let projectNameToDelete = "Project";
    setProjectsByStatus(prev => {
      const newProjectsByStatus = JSON.parse(JSON.stringify(prev)) as ProjectsByStatus;
      for (const status of PROJECT_STATUSES) {
        const list = newProjectsByStatus[status] || [];
        const projectIndex = list.findIndex((p: Project) => p.id === projectToDeleteId);
        if (projectIndex > -1) {
          projectNameToDelete = list[projectIndex].name;
          newProjectsByStatus[status] = list.filter((p:Project) => p.id !== projectToDeleteId);
          break;
        }
      }
      return newProjectsByStatus;
    });
    toast({ title: "Project Deleted", description: `Project "${projectNameToDelete}" removed.` });
    setIsDeleteConfirmOpen(false);
    setProjectToDeleteId(null);
  }, [projectToDeleteId, toast, setProjectsByStatus]);

  const onDragEndProjects = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceStatus = source.droppableId as ProjectStatus;
    const destStatus = destination.droppableId as ProjectStatus;

    setProjectsByStatus(prev => {
      const newProjectsByStatus = JSON.parse(JSON.stringify(prev)) as ProjectsByStatus;
      const sourceProjects = Array.from(newProjectsByStatus[sourceStatus] || []);
      const destProjects = sourceStatus === destStatus ? sourceProjects : Array.from(newProjectsByStatus[destStatus] || []);
      
      const [movedProjectOriginal] = sourceProjects.splice(source.index, 1);
      if (!movedProjectOriginal) return prev;

      if (sourceStatus === destStatus) {
          destProjects.splice(destination.index, 0, movedProjectOriginal);
          newProjectsByStatus[sourceStatus] = destProjects;
          toast({ title: "Project Reordered", description: `Project "${movedProjectOriginal.name}" reordered.` });
      } else {
          const movedProjectCopy = { ...movedProjectOriginal, status: destStatus };
          destProjects.splice(destination.index, 0, movedProjectCopy);
          newProjectsByStatus[sourceStatus] = sourceProjects;
          newProjectsByStatus[destStatus] = destProjects;
          toast({ title: "Project Status Updated", description: `Project "${movedProjectOriginal.name}" moved to ${projectStatusToColumnTitle[destStatus]}.` });
      }
      return newProjectsByStatus;
    });
  }, [toast, setProjectsByStatus]);

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Briefcase className="mr-3 h-8 w-8 text-primary"/>Projects Management</h1>
          <p className="text-muted-foreground">Supervisa tus proyectos.</p>
        </div>
        <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {addProjectForm.reset(); setIsAddProjectDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Add New Project</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Add New Project</DialogTitle><DialogDescription>Enter project details.</DialogDescription></DialogHeader>
            <FormProvider {...addProjectForm}>
            <form onSubmit={addProjectForm.handleSubmit(handleActualAddProjectSubmit)}>
              <ScrollArea className="max-h-[60vh] overflow-y-auto p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={addProjectForm.control} name="name" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Name</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., Q4 Campaign" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="description" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea placeholder="Describe project scope" {...field} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{PROJECT_STATUSES.map(status => <SelectItem key={status} value={status}>{projectStatusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="clientName" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Client</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., Client Inc." {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="teamMembers" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Team</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., John, Jane" {...field} /></FormControl></div><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated.</p><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="progress" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Progress (%)</FormLabel><FormControl className="col-span-3"><Input type="number" placeholder="0-100" {...field} min="0" max="100"/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="deadline" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Deadline</FormLabel><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="date" className="pl-10" {...field} /></FormControl></div></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addProjectForm.formState.isSubmitting}>Save Project</Button></DialogFooter>
            </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={(isOpen) => {
          setIsEditProjectDialogOpen(isOpen);
          if (!isOpen) setEditingProject(null);
      }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Edit Project: {editingProject?.name}</DialogTitle><DialogDescription>Update project details.</DialogDescription></DialogHeader>
          {editingProject && (
             <FormProvider {...editProjectForm}>
            <form onSubmit={editProjectForm.handleSubmit(handleActualEditProjectSubmit)}>
              <ScrollArea className="max-h-[60vh] overflow-y-auto p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={editProjectForm.control} name="name" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Name</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="description" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea {...field} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{PROJECT_STATUSES.map(status => <SelectItem key={status} value={status}>{projectStatusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="clientName" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Client</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="teamMembers" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Team</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated.</p><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="progress" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Progress (%)</FormLabel><FormControl className="col-span-3"><Input type="number" {...field} min="0" max="100"/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="deadline" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Deadline</FormLabel><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="date" className="pl-10" {...field} /></FormControl></div></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editProjectForm.formState.isSubmitting}>Save Changes</Button></DialogFooter>
            </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>

       {/* View Project Dialog */}
      <Dialog open={isViewProjectDialogOpen} onOpenChange={setIsViewProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Project Details: {viewingProject?.name}</DialogTitle>
            <DialogDescription>Read-only view of the project information.</DialogDescription>
          </DialogHeader>
          {viewingProject && (
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-3 py-4 text-sm">
              <div><p className="font-medium text-muted-foreground">Name:</p><p>{viewingProject.name}</p></div>
              {viewingProject.description && (<div><p className="font-medium text-muted-foreground">Description:</p><p className="whitespace-pre-wrap">{viewingProject.description}</p></div>)}
              <div><p className="font-medium text-muted-foreground">Status:</p><div><Badge variant="outline">{projectStatusToColumnTitle[viewingProject.status]}</Badge></div></div>
              {viewingProject.clientName && (<div><p className="font-medium text-muted-foreground">Client:</p><p>{viewingProject.clientName}</p></div>)}
              {viewingProject.team && viewingProject.team.length > 0 && (
                <div><p className="font-medium text-muted-foreground">Team:</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {viewingProject.team.map(member => (
                      <div key={member.name} className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                        <Avatar className="h-5 w-5"><AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.dataAiHint || "avatar person"}/><AvatarFallback className="text-xs">{member.avatarFallback}</AvatarFallback></Avatar>
                        <span className="text-xs">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewingProject.progress !== undefined && (
                <div><p className="font-medium text-muted-foreground">Progress:</p>
                  <div className="flex items-center gap-2">
                    <Progress value={viewingProject.progress} className="h-2 w-full" /> <span className="text-xs">{viewingProject.progress}%</span>
                  </div>
                </div>
              )}
              {viewingProject.deadline && (<div><p className="font-medium text-muted-foreground">Deadline:</p><p>{viewingProject.deadline}</p></div>)}
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
              This action cannot be undone. This will permanently delete project 
              "{Object.values(projectsByStatus).flat().find(p => p.id === projectToDeleteId)?.name || 'this project'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setProjectToDeleteId(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProjectKanbanBoard
          projectsByStatus={projectsByStatus}
          onDragEnd={onDragEndProjects}
          onEditProject={openEditProjectDialog}
          onViewProject={openViewProjectDialog}
          onDeleteProject={triggerDeleteConfirmation}
      />
    </div>
  );
}
