
"use client";

import React, { useState, type FC, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Keep Card for ProjectCard
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Briefcase, CalendarDays, MoreHorizontal, GripVertical, Eye, Edit, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCorners, useDraggable, useDroppable, type DragEndEvent, type Announcements } from "@dnd-kit/core";
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

const initialProjectsData: Project[] = [
  {
    id: "proj-1", name: "Lanzamiento App Móvil", description: "Desarrollo y lanzamiento de la app móvil.", status: "ACTIVO",
    clientName: "Interno", team: [ { name: "Elena V.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", avatarFallback: "EV" }, { name: "Marco C.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "asian man", avatarFallback: "MC" } ],
    progress: 65, deadline: "2024-10-31",
  },
  {
    id: "proj-2", name: "Integración CRM", status: "PLANIFICACION", clientName: "Cliente Alfa", progress: 10, deadline: "2024-11-15",
  },
  {
    id: "proj-3", name: "Campaña Marketing Q4", description: "Planificación y ejecución de la campaña de marketing para el último trimestre.", status: "ACTIVO",
    clientName: "Marketing Dept.", team: [ { name: "Sofia L.", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "latina woman", avatarFallback: "SL" } ],
    progress: 30, deadline: "2024-12-15",
  },
  {
    id: "proj-4", name: "Rediseño Web Corporativa", status: "COMPLETADO", clientName: "CEO Office", progress: 100, deadline: "2024-06-30",
  },
];

const projectStatusToColumnTitle: Record<ProjectStatus, string> = {
  PLANIFICACION: "Planificación", ACTIVO: "Activo", COMPLETADO: "Completado", EN_ESPERA: "En Espera", CANCELADO: "Cancelado",
};

const customAnnouncements: Announcements = {
  onDragStart({ active }) { return `Picked up draggable item ${active.id}.`; },
  onDragOver({ active, over }) { return over ? `Draggable item ${active.id} was moved over droppable area ${over.id}.` : `Draggable item ${active.id} is no longer over a droppable area.`; },
  onDragEnd({ active, over }) { return over ? `Draggable item ${active.id} was dropped over droppable area ${over.id}` : `Draggable item ${active.id} was dropped.`; },
  onDragCancel({ active }) { return `Dragging was cancelled. Draggable item ${active.id} was dropped.`; },
};

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: FC<ProjectCardProps> = React.memo(({ project, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: project.id });
  const style: React.CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, touchAction: 'none' } : { touchAction: 'none' };
  
  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("rounded-lg border bg-card text-card-foreground mb-3 shadow-md hover:shadow-lg transition-shadow cursor-grab", isDragging && "opacity-60")}>
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-semibold leading-tight">{project.name}</CardTitle>
           <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}><Eye className="mr-2 h-4 w-4" /> View/Edit Project</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(project.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {project.clientName && <p className="text-xs text-muted-foreground">Cliente: <span className="font-medium text-foreground">{project.clientName}</span></p>}
        {project.deadline && <p className="text-xs text-muted-foreground flex items-center"><CalendarDays className="h-3.5 w-3.5 mr-1"/>Fecha Límite: {project.deadline}</p>}
        {project.team && project.team.length > 0 && (
          <div className="flex items-center -space-x-2">
            {project.team.map(member => (<Avatar key={member.name} className="h-6 w-6 border-2 border-background"><AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.dataAiHint || "avatar person"}/><AvatarFallback className="text-xs">{member.avatarFallback}</AvatarFallback></Avatar>))}
            <span className="pl-3 text-xs text-muted-foreground">({project.team.length} {project.team.length === 1 ? 'miembro' : 'miembros'})</span>
          </div>)}
        {project.progress !== undefined && (<div><div className="flex justify-between items-center mb-1"><p className="text-xs text-muted-foreground">Progreso:</p><p className="text-xs font-semibold text-primary">{project.progress}%</p></div><Progress value={project.progress} className="h-2" /></div>)}
      </CardContent>
       <CardFooter className="p-3 pt-2 border-t flex justify-end">
         <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100"><GripVertical className="h-4 w-4" /><span className="sr-only">Arrastrar proyecto</span></Button>
      </CardFooter>
    </Card>
  );
});
ProjectCard.displayName = 'ProjectCard';

interface ProjectKanbanBoardProps {
  projects: Project[];
  statuses: readonly ProjectStatus[];
  handleProjectDragEnd: (event: DragEndEvent) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectKanbanBoard: FC<ProjectKanbanBoardProps> = ({ projects, statuses, handleProjectDragEnd, onEditProject, onDeleteProject }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );
  
  return (
     <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleProjectDragEnd} announcements={customAnnouncements}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max h-full">
            {statuses.map((statusKey) => {
              const { isOver, setNodeRef: setDroppableRef } = useDroppable({ id: statusKey });
              const columnProjects = projects.filter(project => project.status === statusKey);
              return (
                <div 
                    key={statusKey} 
                    ref={setDroppableRef} 
                    className={cn(
                        "w-[320px] flex-shrink-0 flex flex-col bg-muted/50 shadow-md rounded-lg transition-colors duration-200 min-h-[400px] p-0", 
                        isOver && "bg-primary/10 border-2 border-primary"
                    )}
                >
                  <div className="p-4 border-b sticky top-0 bg-muted/60 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
                    <h3 className="text-md font-semibold">{projectStatusToColumnTitle[statusKey]}</h3>
                    <Badge variant="secondary" className="text-xs">{columnProjects.length}</Badge>
                  </div>
                  <div className="flex-1 p-3 pr-1 space-y-3 overflow-y-auto">
                    {columnProjects.length === 0 && (<p className="text-xs text-muted-foreground text-center py-4">No hay proyectos en este estado.</p>)}
                    {columnProjects.map(project => (<ProjectCard key={project.id} project={project} onEdit={onEditProject} onDelete={onDeleteProject} />))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DndContext>
  );
};

export default function CrmProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>(initialProjectsData);
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

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

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
    setProjects(prevProjects => [...prevProjects, newProjectToAdd]);
    toast({ title: "Project Added", description: `Project "${newProjectToAdd.name}" added.` });
    resetAddProjectForm(); setIsAddProjectDialogOpen(false);
  }, [newProjectName, newProjectDescription, newProjectStatus, newProjectClientName, newProjectTeam, newProjectProgress, newProjectDeadline, resetAddProjectForm, toast]);

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
    setProjects(prevProjects => prevProjects.map(p => p.id === editingProject.id ? updatedProject : p));
    toast({ title: "Project Updated", description: `Project "${updatedProject.name}" updated.` });
    setIsEditProjectDialogOpen(false); setEditingProject(null);
  }, [editingProject, editFormProjectName, editFormProjectDescription, editFormProjectStatus, editFormProjectClientName, editFormProjectTeam, editFormProjectProgress, editFormProjectDeadline, toast]);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    toast({ title: "Project Deleted (Demo)", description: "Project has been removed." });
  }, [toast]);

  const handleProjectDragEnd = useCallback((event: DragEndEvent) => {
    console.log("DragEnd Event:", JSON.parse(JSON.stringify(event)));
    const { active, over } = event;
    console.log("Active ID:", active.id as string);
    console.log("Over ID:", over ? over.id as string : null);

    if (!over) { 
      console.log("Drag ended but no valid 'over' target.");
      return; 
    }
    
    const projectId = active.id as string;
    const targetStatus = over.id as ProjectStatus;

    const projectToMove = projects.find(p => p.id === projectId);

    if (projectToMove && projectToMove.status !== targetStatus) {
      console.log(`Attempting to move project ${projectId} to status ${targetStatus}`);
      const updatedProject = { ...projectToMove, status: targetStatus };
      setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
      toast({ title: "Project Status Updated", description: `Project "${projectToMove.name}" moved to ${projectStatusToColumnTitle[targetStatus]}.`});
    } else {
      console.log(`Project ${projectId} not moved. Current status: ${projectToMove?.status}, target status: ${targetStatus}.`);
    }
  }, [projects, toast]); // setProjects was missing from dependency array

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
      <p className="text-sm text-muted-foreground flex-shrink-0">Arrastra los proyectos entre columnas para cambiar su estado.</p>
      
      {isClient ? (
        <ProjectKanbanBoard 
            projects={projects} 
            statuses={PROJECT_STATUSES}
            handleProjectDragEnd={handleProjectDragEnd} 
            onEditProject={openEditProjectDialog} 
            onDeleteProject={handleDeleteProject} 
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading board...</div>
      )}
    </div>
  );
}
