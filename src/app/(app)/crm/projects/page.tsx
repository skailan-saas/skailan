
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
import { PlusCircle, Briefcase, CalendarDays, MoreHorizontal, Eye, Edit, Trash2, Tag, Zap as OpportunityIcon, Users as TeamIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import { ScrollArea } from '@/components/ui/scroll-area';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider, Controller } from "react-hook-form"; // Added Controller
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { ProjectStatus as PrismaProjectStatus } from '@prisma/client';
import { 
    getProjects, createProject, updateProject, deleteProject, updateProjectStatus,
    getLeadsForSelect, getUsersForSelect, 
    type ProjectFE, type ProjectFormValues as ServerProjectFormValues
} from './actions';
// Assuming MultiSelect component exists or will be created
// import { MultiSelect } from '@/components/ui/multi-select'; 

// Placeholder MultiSelect for now
const MultiSelect = ({ options, selected, onChange, placeholder }: { options: {value: string, label: string | null}[], selected: string[], onChange: (selected: string[]) => void, placeholder: string }) => {
    // This is a very basic placeholder. You'd replace this with a real MultiSelect component.
    const [isOpen, setIsOpen] = useState(false);
    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value) ? selected.filter(s => s !== value) : [...selected, value];
        onChange(newSelected);
    }
    return (
        <div className="relative">
            <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setIsOpen(!isOpen)}>
                {selected.length > 0 ? `${selected.length} selected` : placeholder}
                <MoreHorizontal className="h-4 w-4 opacity-50" />
            </Button>
            {isOpen && (
                <div className="absolute z-10 w-full bg-popover border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {options.map(option => (
                        <div key={option.value} className="flex items-center p-2 hover:bg-accent cursor-pointer" onClick={() => handleSelect(option.value)}>
                            <input type="checkbox" checked={selected.includes(option.value)} readOnly className="mr-2"/>
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const PROJECT_STATUSES_CLIENT = ["PLANNING", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELED"] as const;
type ProjectStatusClient = typeof PROJECT_STATUSES_CLIENT[number];

type ProjectsByStatus = {
  [key in ProjectStatusClient]: ProjectFE[];
};

const projectStatusToColumnTitle: Record<ProjectStatusClient, string> = {
  PLANNING: "Planificación", ACTIVE: "Activo", COMPLETED: "Completado", ON_HOLD: "En Espera", CANCELED: "Cancelado",
};

const ProjectFormSchemaClient = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional().nullable(),
    status: z.enum(PROJECT_STATUSES_CLIENT, { required_error: "Status is required" }),
    companyId: z.string().optional().nullable(),
    opportunityId: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    budget: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
        z.number().nonnegative("Budget must be a positive number").optional().nullable()
    ),
    teamMemberIds: z.array(z.string()).optional(), 
    tagNames: z.string().optional().nullable(), 
});
type ProjectFormValuesClient = z.infer<typeof ProjectFormSchemaClient>;


interface ProjectCardProps {
  project: ProjectFE;
  index: number;
  onEdit: (project: ProjectFE) => void;
  onView: (project: ProjectFE) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: FC<ProjectCardProps> = React.memo(({ project, index, onEdit, onView, onDelete }) => {
  const calculateProgress = (status: ProjectStatusClient, tasksCount?: number): number => {
    if (status === "COMPLETED") return 100;
    if (status === "CANCELED") return 0;
    // Simple progress based on status, could be more sophisticated with task completion data
    if (status === "ACTIVE" && tasksCount && tasksCount > 0) return Math.min(90, Math.floor(Math.random() * 50) + 30); // Random 30-80%
    if (status === "ACTIVE") return 50;
    if (status === "PLANNING") return 10;
    if (status === "ON_HOLD") return project.tasksCount && project.tasksCount > 0 ? 40 : 5;
    return 0;
  };
  const progress = calculateProgress(project.status as ProjectStatusClient, project.tasksCount);

  return (
    <Draggable draggableId={String(project.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style, userSelect: "none" }}
          className={cn(
            "p-3 rounded-lg border bg-card text-card-foreground mb-3 shadow-md hover:shadow-lg transition-shadow",
            snapshot.isDragging && "shadow-xl opacity-80"
          )}
          data-ai-hint={project.dataAiHint || "project folder"}
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
          {project.companyName && <p className="text-xs text-muted-foreground mb-1">Cliente: <span className="font-medium text-foreground">{project.companyName}</span></p>}
          {project.endDate && <p className="text-xs text-muted-foreground flex items-center mb-1"><CalendarDays className="h-3.5 w-3.5 mr-1"/>Fecha Límite: {new Date(project.endDate).toLocaleDateString()}</p>}
          
          {project.opportunityName && (
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <OpportunityIcon className="h-3.5 w-3.5 text-blue-500"/><span>De: {project.opportunityName}</span>
            </div>
          )}

          {project.teamMembers && project.teamMembers.length > 0 && (
            <div className="flex items-center -space-x-2 my-2">
              {project.teamMembers.slice(0,3).map(member => (<Avatar key={member.id} className="h-6 w-6 border-2 border-background"><AvatarImage src={member.avatarUrl || `https://placehold.co/40x40.png`} alt={member.name || 'U'} data-ai-hint={member.dataAiHint || "avatar person"}/><AvatarFallback className="text-xs">{(member.name || 'U').substring(0,2).toUpperCase()}</AvatarFallback></Avatar>))}
              {project.teamMembers.length > 3 && <Badge variant="outline" className="text-xs ml-3 h-6">+{project.teamMembers.length - 3} más</Badge>}
            </div>
          )}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 my-2">
                {project.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}
            </div>
          )}
          {progress !== undefined && (
            <div>
                <div className="flex justify-between items-center mb-1"><p className="text-xs text-muted-foreground">Progreso:</p><p className="text-xs font-semibold text-primary">{progress}%</p></div>
                <Progress value={progress} className="h-2" />
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
  onEditProject: (project: ProjectFE) => void;
  onViewProject: (project: ProjectFE) => void;
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
            {PROJECT_STATUSES_CLIENT.map((statusKey) => (
              <Droppable key={statusKey} droppableId={statusKey} type="PROJECT">
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
                    <ScrollArea className="flex-1">
                    <div className="p-3 pr-1 space-y-0 ">
                      {(projectsByStatus[statusKey] || []).map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} onEdit={onEditProject} onView={onViewProject} onDelete={onDeleteProject} />
                      ))}
                      {provided.placeholder}
                      {(!projectsByStatus[statusKey] || projectsByStatus[statusKey].length === 0) && (<p className="text-xs text-muted-foreground text-center py-4">No hay proyectos en este estado.</p>)}
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
ProjectKanbanBoard.displayName = 'ProjectKanbanBoard';


export default function CrmProjectsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [projectsByStatus, setProjectsByStatus] = useState<ProjectsByStatus>({ PLANNING: [], ACTIVE: [], COMPLETED: [], ON_HOLD: [], CANCELED: [] });
  
  const [opportunitiesForSelect, setOpportunitiesForSelect] = useState<{id: string, name: string}[]>([]);
  const [usersForSelect, setUsersForSelect] = useState<{id: string, name: string | null}[]>([]);
  // const [companiesForSelect, setCompaniesForSelect] = useState<{id: string, name: string}[]>([]); // Uncomment if needed


  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectFE | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  const [isViewProjectDialogOpen, setIsViewProjectDialogOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<ProjectFE | null>(null);

  const addProjectForm = useForm<ProjectFormValuesClient>({
    resolver: zodResolver(ProjectFormSchemaClient),
    defaultValues: { name: "", description: "", status: "PLANNING", opportunityId: null, companyId: null, startDate: null, endDate: null, budget: null, teamMemberIds: [], tagNames: "" },
  });

  const editProjectForm = useForm<ProjectFormValuesClient>({
    resolver: zodResolver(ProjectFormSchemaClient),
  });

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedProjects, fetchedOpportunities, fetchedUsers /*, fetchedCompanies */] = await Promise.all([
            getProjects(),
            getLeadsForSelect(), 
            getUsersForSelect(),
            // getCompaniesForSelect(), // Fetch if you add company selector
        ]);
        
        const initialStatusMap: ProjectsByStatus = { PLANNING: [], ACTIVE: [], COMPLETED: [], ON_HOLD: [], CANCELED: [] };
        fetchedProjects.forEach(project => {
            const statusKey = project.status as ProjectStatusClient;
            if (initialStatusMap[statusKey]) {
                initialStatusMap[statusKey].push(project);
            } else {
                initialStatusMap[statusKey] = [project]; // Initialize if somehow empty
            }
        });
        setProjectsByStatus(initialStatusMap);
        setOpportunitiesForSelect(fetchedOpportunities);
        setUsersForSelect(fetchedUsers);
        // setCompaniesForSelect(fetchedCompanies);
    } catch (error: any) {
        toast({ title: "Error fetching data", description: error.message || "Could not load project data.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (editingProject) {
        editProjectForm.reset({
            name: editingProject.name,
            description: editingProject.description || "",
            status: editingProject.status as ProjectStatusClient,
            companyId: editingProject.companyId || null,
            opportunityId: editingProject.opportunityId || null,
            startDate: editingProject.startDate ? new Date(editingProject.startDate).toISOString().split('T')[0] : null,
            endDate: editingProject.endDate ? new Date(editingProject.endDate).toISOString().split('T')[0] : null,
            budget: editingProject.budget ?? null,
            teamMemberIds: editingProject.teamMembers.map(tm => tm.id) || [],
            tagNames: editingProject.tags?.join(", ") || "",
        });
    }
  }, [editingProject, editProjectForm]);

  const refreshProjects = useCallback(async () => {
    setIsLoading(true); 
    try {
        const fetchedProjects = await getProjects();
        const newStatusMap: ProjectsByStatus = { PLANNING: [], ACTIVE: [], COMPLETED: [], ON_HOLD: [], CANCELED: [] };
        fetchedProjects.forEach(project => {
             const statusKey = project.status as ProjectStatusClient;
            if (newStatusMap[statusKey]) {
                newStatusMap[statusKey].push(project);
            } else {
                 newStatusMap[statusKey] = [project];
            }
        });
        setProjectsByStatus(newStatusMap);
    } catch (error: any) {
        toast({ title: "Error refreshing projects", description: error.message || "Could not reload projects.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const handleActualAddProjectSubmit = async (values: ProjectFormValuesClient) => {
    const serverValues: ServerProjectFormValues = {
        ...values,
        budget: values.budget === null ? null : Number(values.budget),
        tagNames: values.tagNames ? values.tagNames.split(',').map(t => t.trim()).filter(t => t) : [],
    };
    try {
      addProjectForm.control._formState.isSubmitting = true;
      await createProject(serverValues);
      toast({ title: "Project Added", description: `Project "${values.name}" added.` });
      addProjectForm.reset(); 
      setIsAddProjectDialogOpen(false);
      refreshProjects();
    } catch (error: any) {
        toast({ title: "Error Adding Project", description: error.message || "Could not add project.", variant: "destructive"});
    } finally {
        addProjectForm.control._formState.isSubmitting = false;
    }
  };

  const openEditProjectDialog = useCallback((project: ProjectFE) => {
    setEditingProject(project);
    setIsEditProjectDialogOpen(true);
  }, []);

  const openViewProjectDialog = useCallback((project: ProjectFE) => {
    setViewingProject(project);
    setIsViewProjectDialogOpen(true);
  }, []);

  const handleActualEditProjectSubmit = async (values: ProjectFormValuesClient) => {
    if (!editingProject) return;
    const serverValues: ServerProjectFormValues = {
        ...values,
        budget: values.budget === null ? null : Number(values.budget),
        tagNames: values.tagNames ? values.tagNames.split(',').map(t => t.trim()).filter(t => t) : [],
    };
    try {
      editProjectForm.control._formState.isSubmitting = true;
      await updateProject(editingProject.id, serverValues);
      toast({ title: "Project Updated", description: `Project "${values.name}" updated.` });
      setIsEditProjectDialogOpen(false); 
      setEditingProject(null);
      refreshProjects();
    } catch (error: any) {
        toast({ title: "Error Updating Project", description: error.message || "Could not update project.", variant: "destructive"});
    } finally {
        editProjectForm.control._formState.isSubmitting = false;
    }
  };

  const triggerDeleteConfirmation = useCallback((id: string) => {
    setProjectToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteProject = async () => {
    if (!projectToDeleteId) return;
    const projectToDelete = Object.values(projectsByStatus).flat().find(p => p.id === projectToDeleteId);
    try {
      await deleteProject(projectToDeleteId);
      toast({ title: "Project Deleted", description: `Project "${projectToDelete?.name || 'Project'}" marked as deleted.` });
      refreshProjects();
    } catch (error: any) {
        toast({ title: "Error Deleting Project", description: error.message || "Could not delete project.", variant: "destructive"});
    }
    setIsDeleteConfirmOpen(false);
    setProjectToDeleteId(null);
  };

  const onDragEndProjects = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceStatus = source.droppableId as ProjectStatusClient;
    const destStatus = destination.droppableId as ProjectStatusClient;
    
    let movedProjectOriginal: ProjectFE | undefined;
    const newProjectsByStatus = JSON.parse(JSON.stringify(projectsByStatus)) as ProjectsByStatus;

    const sourceList = newProjectsByStatus[sourceStatus];
    movedProjectOriginal = sourceList.find(p => p.id === draggableId);
    newProjectsByStatus[sourceStatus] = sourceList.filter(p => p.id !== draggableId);

    if (!movedProjectOriginal) return;

    movedProjectOriginal.status = destStatus as PrismaProjectStatus;
    const destList = newProjectsByStatus[destStatus] || [];
    destList.splice(destination.index, 0, movedProjectOriginal);
    newProjectsByStatus[destStatus] = destList;
    
    setProjectsByStatus(newProjectsByStatus); // Optimistic UI Update

    try {
        await updateProjectStatus(draggableId, destStatus as PrismaProjectStatus);
        toast({ title: "Project Updated", description: `Project "${movedProjectOriginal.name}" status updated to ${projectStatusToColumnTitle[destStatus]}.` });
        // No need to call refreshProjects if optimistic update + backend call are successful
    } catch (error: any) {
        toast({ title: "Error Updating Status", description: error.message || "Could not update project status.", variant: "destructive" });
        refreshProjects(); // Revert optimistic update by re-fetching
    }
  };

  if (isLoading && !Object.values(projectsByStatus).flat().length) {
    return <div className="p-6 text-center text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Briefcase className="mr-3 h-8 w-8 text-primary"/>Projects Management</h1>
          <p className="text-muted-foreground">Supervisa tus proyectos.</p>
        </div>
        <Dialog open={isAddProjectDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) addProjectForm.reset(); 
            setIsAddProjectDialogOpen(isOpen);
        }}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add New Project</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Add New Project</DialogTitle><DialogDescription>Enter project details.</DialogDescription></DialogHeader>
            <FormProvider {...addProjectForm}>
            <form onSubmit={addProjectForm.handleSubmit(handleActualAddProjectSubmit)}>
              <ScrollArea className="max-h-[60vh] overflow-y-auto p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={addProjectForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input placeholder="e.g., Q4 Campaign" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe project scope" {...field} value={field.value ?? ""} rows={3}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{PROJECT_STATUSES_CLIENT.map(status => <SelectItem key={status} value={status}>{projectStatusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="opportunityId" render={({ field }) => (<FormItem><FormLabel>Link to Opportunity (Lead)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select an opportunity" /></SelectTrigger></FormControl><SelectContent>{opportunitiesForSelect.map(opp => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={addProjectForm.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={addProjectForm.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={addProjectForm.control} name="budget" render={({ field }) => (<FormItem><FormLabel>Budget ($)</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addProjectForm.control} name="teamMemberIds"
                    render={({ field }) => ( <FormItem> <FormLabel>Team Members</FormLabel>
                        <Controller control={addProjectForm.control} name="teamMemberIds" defaultValue={[]}
                            render={({ field: controllerField }) => (
                                <MultiSelect options={usersForSelect.map(u => ({ value: u.id, label: u.name || u.id }))}
                                    selected={controllerField.value || []} onChange={controllerField.onChange} placeholder="Select team members..." />
                            )} /> <FormMessage /> </FormItem> )} />
                  <FormField control={addProjectForm.control} name="tagNames" render={({ field }) => (<FormItem><FormLabel>Tags</FormLabel><FormControl><Input placeholder="e.g., marketing, Q4 (comma-separated)" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addProjectForm.formState.isSubmitting}>{addProjectForm.formState.isSubmitting ? "Saving..." : "Save Project"}</Button></DialogFooter>
            </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditProjectDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) { setEditingProject(null); editProjectForm.reset(); }
          setIsEditProjectDialogOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Edit Project: {editingProject?.name}</DialogTitle><DialogDescription>Update project details.</DialogDescription></DialogHeader>
          {editingProject && (
             <FormProvider {...editProjectForm}>
            <form onSubmit={editProjectForm.handleSubmit(handleActualEditProjectSubmit)}>
              <ScrollArea className="max-h-[60vh] overflow-y-auto p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={editProjectForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={3}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{PROJECT_STATUSES_CLIENT.map(status => <SelectItem key={status} value={status}>{projectStatusToColumnTitle[status]}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="opportunityId" render={({ field }) => (<FormItem><FormLabel>Link to Opportunity (Lead)</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select an opportunity" /></SelectTrigger></FormControl><SelectContent>{opportunitiesForSelect.map(opp => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={editProjectForm.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editProjectForm.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={editProjectForm.control} name="budget" render={({ field }) => (<FormItem><FormLabel>Budget ($)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editProjectForm.control} name="teamMemberIds"
                    render={({ field }) => ( <FormItem> <FormLabel>Team Members</FormLabel>
                        <Controller control={editProjectForm.control} name="teamMemberIds" defaultValue={[]}
                            render={({ field: controllerField }) => (
                                <MultiSelect options={usersForSelect.map(u => ({ value: u.id, label: u.name || u.id }))}
                                    selected={controllerField.value || []} onChange={controllerField.onChange} placeholder="Select team members..." />
                            )} /> <FormMessage /> </FormItem> )} />
                  <FormField control={editProjectForm.control} name="tagNames" render={({ field }) => (<FormItem><FormLabel>Tags</FormLabel><FormControl><Input placeholder="e.g., marketing, Q4 (comma-separated)" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editProjectForm.formState.isSubmitting}>{editProjectForm.formState.isSubmitting ? "Saving..." : "Save Changes"}</Button></DialogFooter>
            </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>

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
              <div><p className="font-medium text-muted-foreground">Status:</p><div><Badge variant="outline">{projectStatusToColumnTitle[viewingProject.status as ProjectStatusClient]}</Badge></div></div>
              {viewingProject.companyName && (<div><p className="font-medium text-muted-foreground">Client Company:</p><p>{viewingProject.companyName}</p></div>)}
              {viewingProject.opportunityName && (<div><p className="font-medium text-muted-foreground">Originating Opportunity:</p><div className="flex items-center gap-1"><OpportunityIcon className="h-4 w-4 text-blue-500"/><p>{viewingProject.opportunityName}</p></div></div>)}
              {viewingProject.startDate && (<div><p className="font-medium text-muted-foreground">Start Date:</p><p>{new Date(viewingProject.startDate).toLocaleDateString()}</p></div>)}
              {viewingProject.endDate && (<div><p className="font-medium text-muted-foreground">End Date:</p><p>{new Date(viewingProject.endDate).toLocaleDateString()}</p></div>)}
              {viewingProject.budget !== null && viewingProject.budget !== undefined && (<div><p className="font-medium text-muted-foreground">Budget:</p><p>${viewingProject.budget.toLocaleString()}</p></div>)}
              {viewingProject.teamMembers && viewingProject.teamMembers.length > 0 && (
                <div><p className="font-medium text-muted-foreground">Team:</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {viewingProject.teamMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                        <Avatar className="h-5 w-5"><AvatarImage src={member.avatarUrl || `https://placehold.co/40x40.png`} alt={member.name || 'U'} data-ai-hint={member.dataAiHint || "avatar person"} /><AvatarFallback className="text-xs">{(member.name || 'U').substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                        <span className="text-xs">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewingProject.tags && viewingProject.tags.length > 0 && (
                 <div><p className="font-medium text-muted-foreground">Tags:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingProject.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}
                  </div>
                </div>
              )}
              {viewingProject.tasksCount !== undefined && (<div><p className="font-medium text-muted-foreground">Tasks Count:</p><p>{viewingProject.tasksCount}</p></div>)}
              <div><p className="font-medium text-muted-foreground">Created At:</p><p>{new Date(viewingProject.createdAt).toLocaleString()}</p></div>
              <div><p className="font-medium text-muted-foreground">Last Updated:</p><p>{new Date(viewingProject.updatedAt).toLocaleString()}</p></div>
            </div>
            </ScrollArea>
          )}
          <DialogFooter> <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark project 
              "{Object.values(projectsByStatus).flat().find(p => p.id === projectToDeleteId)?.name || 'this project'}" as deleted.
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
       <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Showing {Object.values(projectsByStatus).flat().length} projects.
      </div>
    </div>
  );
}
