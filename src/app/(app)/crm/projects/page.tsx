
"use client";

import React, { useState, type FC, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Briefcase, CalendarDays, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";

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
}

type ProjectsByStatus = {
  [key in ProjectStatus]: Project[];
};

const initialProjectsData: Project[] = [
  { id: "proj-1", name: "Lanzamiento App Móvil", description: "Desarrollo y lanzamiento de la app móvil.", status: "ACTIVO", clientName: "Interno", team: [ { name: "Elena V.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", avatarFallback: "EV" }, { name: "Marco C.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "asian man", avatarFallback: "MC" } ], progress: 65, deadline: "2024-10-31", },
  { id: "proj-2", name: "Integración CRM", status: "PLANIFICACION", clientName: "Cliente Alfa", progress: 10, deadline: "2024-11-15", },
  { id: "proj-3", name: "Campaña Marketing Q4", description: "Planificación y ejecución de la campaña de marketing para el último trimestre.", status: "ACTIVO", clientName: "Marketing Dept.", team: [ { name: "Sofia L.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "latina woman", avatarFallback: "SL" } ], progress: 30, deadline: "2024-12-15", },
  { id: "proj-4", name: "Rediseño Web Corporativa", status: "COMPLETADO", clientName: "CEO Office", progress: 100, deadline: "2024-06-30", },
];

const projectStatusToColumnTitle: Record<ProjectStatus, string> = {
  PLANIFICACION: "Planificación", ACTIVO: "Activo", COMPLETADO: "Completado", EN_ESPERA: "En Espera", CANCELADO: "Cancelado",
};

interface ProjectCardProps {
  project: Project;
  index: number;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: FC<ProjectCardProps> = ({ project, index, onEdit, onDelete }) => {
  return (
    <Draggable draggableId={String(project.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
          }}
          className={cn(
            "p-3 rounded-lg border bg-card text-card-foreground mb-3 shadow-md hover:shadow-lg transition-shadow rbd-draggable-card",
            snapshot.isDragging && "shadow-xl opacity-80"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold leading-tight">{project.name}</h4>
            {/* Temporarily remove DropdownMenu for debugging D&D */}
            {/*
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}><Eye className="mr-2 h-4 w-4" /> View/Edit Project</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(project.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete Project</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            */}
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
};
ProjectCard.displayName = 'ProjectCard';

interface ProjectKanbanBoardProps {
  projectsByStatus: ProjectsByStatus;
  onDragEnd: (result: DropResult) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectKanbanBoard: FC<ProjectKanbanBoardProps> = ({ projectsByStatus, onDragEnd, onEditProject, onDeleteProject }) => {
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
                      <Badge variant="secondary" className="text-xs">{projectsByStatus[statusKey]?.length || 0}</Badge>
                    </div>
                    <div className="flex-1 p-3 pr-1 space-y-0 overflow-y-auto"> 
                      {projectsByStatus[statusKey]?.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} onEdit={onEditProject} onDelete={onDeleteProject} />
                      ))}
                      {provided.placeholder}
                      {(projectsByStatus[statusKey]?.length === 0) && (<p className="text-xs text-muted-foreground text-center py-4">No hay proyectos en este estado.</p>)}
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

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>("PLANIFICACION");
  const [newProjectClientName, setNewProjectClientName] = useState("");
  const [newProjectTeam, setNewProjectTeam] = useState("");
  const [newProjectProgress, setNewProjectProgress] = useState<number | string>(0);
  const [newProjectDeadline, setNewProjectDeadline] = useState("");

  const [editFormProjectName, setEditFormProjectName] = useState("");
  const [editFormProjectDescription, setEditFormProjectDescription] = useState("");
  const [editFormProjectStatus, setEditFormProjectStatus] = useState<ProjectStatus>("PLANIFICACION");
  const [editFormProjectClientName, setEditFormProjectClientName] = useState("");
  const [editFormProjectTeam, setEditFormProjectTeam] = useState("");
  const [editFormProjectProgress, setEditFormProjectProgress] = useState<number | string>(0);
  const [editFormProjectDeadline, setEditFormProjectDeadline] = useState("");

  const resetAddProjectForm = useCallback(() => {
    setNewProjectName(""); setNewProjectDescription(""); setNewProjectStatus("PLANIFICACION");
    setNewProjectClientName(""); setNewProjectTeam(""); setNewProjectProgress(0); setNewProjectDeadline("");
  }, []);

  const handleAddProjectSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const progressValue = parseInt(String(newProjectProgress), 10);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) { toast({ title: "Invalid Progress", description: "Progress must be 0-100.", variant: "destructive" }); return; }
    const teamMembers: ProjectTeamMember[] = newProjectTeam.split(',').map(name => name.trim()).filter(name => name).map(name => ({ name, avatarUrl: `https://placehold.co/40x40.png?text=${name[0]}`, dataAiHint: "avatar person", avatarFallback: name.substring(0,2).toUpperCase()}));
    const newProjectToAdd: Project = {
      id: `proj-${Date.now()}`, name: newProjectName, description: newProjectDescription || undefined,
      status: newProjectStatus, clientName: newProjectClientName || undefined, team: teamMembers.length > 0 ? teamMembers : undefined,
      progress: progressValue, deadline: newProjectDeadline || undefined,
    };
    setProjectsByStatus(prev => {
        const newState = {...prev};
        newState[newProjectStatus] = [...(newState[newProjectStatus] || []), newProjectToAdd];
        return newState;
    });
    toast({ title: "Project Added", description: `Project "${newProjectToAdd.name}" added.` });
    resetAddProjectForm(); setIsAddProjectDialogOpen(false);
  }, [newProjectName, newProjectDescription, newProjectStatus, newProjectClientName, newProjectTeam, newProjectProgress, newProjectDeadline, resetAddProjectForm, toast, setProjectsByStatus]);

  const openEditProjectDialog = useCallback((project: Project) => {
    setEditingProject(project);
    setEditFormProjectName(project.name); setEditFormProjectDescription(project.description || "");
    setEditFormProjectStatus(project.status); setEditFormProjectClientName(project.clientName || "");
    setEditFormProjectTeam(project.team?.map(m => m.name).join(", ") || "");
    setEditFormProjectProgress(project.progress || 0); setEditFormProjectDeadline(project.deadline || "");
    setIsEditProjectDialogOpen(true);
  }, []);

  const handleEditProjectSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProject) return;
    const progressValue = parseInt(String(editFormProjectProgress), 10);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) { toast({ title: "Invalid Progress", description: "Progress must be 0-100.", variant: "destructive" }); return; }
    const teamMembers: ProjectTeamMember[] = editFormProjectTeam.split(',').map(name => name.trim()).filter(name => name).map(name => ({ name, avatarUrl: `https://placehold.co/40x40.png?text=${name[0]}`, dataAiHint: "avatar person", avatarFallback: name.substring(0,2).toUpperCase()}));
    
    const updatedProject: Project = {
      ...editingProject, name: editFormProjectName, description: editFormProjectDescription || undefined,
      status: editFormProjectStatus, clientName: editFormProjectClientName || undefined, team: teamMembers.length > 0 ? teamMembers : undefined,
      progress: progressValue, deadline: editFormProjectDeadline || undefined,
    };

    setProjectsByStatus(prev => {
      const newProjectsByStatus = JSON.parse(JSON.stringify(prev)); // Deep copy
      const oldStatus = editingProject.status;
      const newStatus = updatedProject.status;

      newProjectsByStatus[oldStatus] = (newProjectsByStatus[oldStatus] || []).filter((p: Project) => p.id !== editingProject.id);
      newProjectsByStatus[newStatus] = [...(newProjectsByStatus[newStatus] || []), updatedProject];
      return newProjectsByStatus;
    });

    toast({ title: "Project Updated", description: `Project "${updatedProject.name}" updated.` });
    setIsEditProjectDialogOpen(false); setEditingProject(null);
  }, [editingProject, editFormProjectName, editFormProjectDescription, editFormProjectStatus, editFormProjectClientName, editFormProjectTeam, editFormProjectProgress, editFormProjectDeadline, toast, setProjectsByStatus]);

  const handleDeleteProject = useCallback((projectId: string) => {
    let projectToDelete: Project | undefined;
    setProjectsByStatus(prev => {
      const newProjectsByStatus = JSON.parse(JSON.stringify(prev));
      for (const status of PROJECT_STATUSES) {
        const list = newProjectsByStatus[status] || [];
        const projectIndex = list.findIndex((p: Project) => p.id === projectId);
        if (projectIndex > -1) {
          projectToDelete = list[projectIndex];
          newProjectsByStatus[status] = list.filter((p:Project) => p.id !== projectId);
          break;
        }
      }
      return newProjectsByStatus;
    });
     if (projectToDelete) {
      toast({ title: "Project Deleted (Demo)", description: `Project "${projectToDelete.name}" removed.` });
    }
  }, [toast, setProjectsByStatus]);

  const onDragEndProjects = useCallback((result: DropResult) => {
    const { source, destination } = result;
    console.log("DragEnd Result Projects:", JSON.parse(JSON.stringify(result)));

    if (!destination) {
      console.log("No destination, drag cancelled or invalid.");
      return;
    }

    const sourceStatus = source.droppableId as ProjectStatus;
    const destStatus = destination.droppableId as ProjectStatus;
    
    if (sourceStatus === destStatus) {
      const items = Array.from(projectsByStatus[sourceStatus] || []);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      setProjectsByStatus(prev => ({
        ...prev,
        [sourceStatus]: items,
      }));
      toast({ title: "Project Reordered", description: `Project "${reorderedItem.name}" reordered in ${projectStatusToColumnTitle[sourceStatus]}.` });
    } else {
      const sourceProjects = Array.from(projectsByStatus[sourceStatus] || []);
      const destProjects = Array.from(projectsByStatus[destStatus] || []);
      const [movedProject] = sourceProjects.splice(source.index, 1);
      
      if(!movedProject) {
        console.warn("Could not find moved project in source list.");
        return;
      }

      const movedProjectCopy = { ...movedProject, status: destStatus };
      destProjects.splice(destination.index, 0, movedProjectCopy);

      setProjectsByStatus(prev => ({
        ...prev,
        [sourceStatus]: sourceProjects,
        [destStatus]: destProjects,
      }));
      toast({ title: "Project Status Updated", description: `Project "${movedProject.name}" moved to ${projectStatusToColumnTitle[destStatus]}.` });
    }
  }, [projectsByStatus, toast, setProjectsByStatus]); 

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Briefcase className="mr-3 h-8 w-8 text-primary"/>Projects Management</h1>
          <p className="text-muted-foreground">Supervisa tus proyectos.</p>
        </div>
        <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add New Project</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Add New Project</DialogTitle><DialogDescription>Enter project details.</DialogDescription></DialogHeader>
            <form onSubmit={handleAddProjectSubmit}>
              <div className="max-h-[60vh] overflow-y-auto p-1">
                <div className="grid gap-4 py-4 pr-4">
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newProjectName" className="text-right col-span-1">Name</Label><Input id="newProjectName" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g., Q4 Campaign" className="col-span-3" required /></div>
                  <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="newProjectDescription" className="text-right col-span-1 pt-2">Description</Label><Textarea id="newProjectDescription" value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="Describe project scope" className="col-span-3" rows={3}/></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newProjectStatus" className="text-right col-span-1">Status</Label><Select value={newProjectStatus} onValueChange={(value: ProjectStatus) => setNewProjectStatus(value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map(status => <SelectItem key={status} value={status}>{projectStatusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newProjectClientName" className="text-right col-span-1">Client</Label><Input id="newProjectClientName" value={newProjectClientName} onChange={(e) => setNewProjectClientName(e.target.value)} placeholder="e.g., Client Inc." className="col-span-3" /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newProjectTeam" className="text-right col-span-1">Team</Label><Input id="newProjectTeam" value={newProjectTeam} onChange={(e) => setNewProjectTeam(e.target.value)} placeholder="e.g., John, Jane" className="col-span-3" /><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated.</p></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newProjectProgress" className="text-right col-span-1">Progress (%)</Label><Input id="newProjectProgress" type="number" value={newProjectProgress} onChange={(e) => setNewProjectProgress(e.target.value)} placeholder="0-100" className="col-span-3" min="0" max="100"/></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="newProjectDeadline" className="text-right col-span-1">Deadline</Label><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="newProjectDeadline" type="date" value={newProjectDeadline} onChange={(e) => setNewProjectDeadline(e.target.value)} className="pl-10" /></div></div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline" onClick={resetAddProjectForm}>Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Project</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Edit Project: {editingProject?.name}</DialogTitle><DialogDescription>Update project details.</DialogDescription></DialogHeader>
          <form onSubmit={handleEditProjectSubmit}>
            <div className="max-h-[60vh] overflow-y-auto p-1">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormProjectName" className="text-right col-span-1">Name</Label><Input id="editFormProjectName" value={editFormProjectName} onChange={(e) => setEditFormProjectName(e.target.value)} className="col-span-3" required /></div>
                <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="editFormProjectDescription" className="text-right col-span-1 pt-2">Description</Label><Textarea id="editFormProjectDescription" value={editFormProjectDescription} onChange={(e) => setEditFormProjectDescription(e.target.value)} className="col-span-3" rows={3}/></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormProjectStatus" className="text-right col-span-1">Status</Label><Select value={editFormProjectStatus} onValueChange={(value: ProjectStatus) => setEditFormProjectStatus(value)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map(status => <SelectItem key={status} value={status}>{projectStatusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormProjectClientName" className="text-right col-span-1">Client</Label><Input id="editFormProjectClientName" value={editFormProjectClientName} onChange={(e) => setEditFormProjectClientName(e.target.value)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormProjectTeam" className="text-right col-span-1">Team</Label><Input id="editFormProjectTeam" value={editFormProjectTeam} onChange={(e) => setEditFormProjectTeam(e.target.value)} className="col-span-3" /><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated.</p></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormProjectProgress" className="text-right col-span-1">Progress (%)</Label><Input id="editFormProjectProgress" type="number" value={editFormProjectProgress} onChange={(e) => setEditFormProjectProgress(e.target.value)} className="col-span-3" min="0" max="100"/></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editFormProjectDeadline" className="text-right col-span-1">Deadline</Label><div className="col-span-3 relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="editFormProjectDeadline" type="date" value={editFormProjectDeadline} onChange={(e) => setEditFormProjectDeadline(e.target.value)} className="pl-10" /></div></div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsEditProjectDialogOpen(false)}>Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <ProjectKanbanBoard 
          projectsByStatus={projectsByStatus}
          onDragEnd={onDragEndProjects}
          onEditProject={openEditProjectDialog} 
          onDeleteProject={handleDeleteProject} 
      />
    </div>
  );
}
