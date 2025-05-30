
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
import { PlusCircle, Briefcase, Users, GripVertical, MoreHorizontal, Percent, CalendarDays } from "lucide-react";
import { useState, type FC, type FormEvent } from "react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";


// Based on Prisma ProjectStatus enum
const PROJECT_STATUSES = ["PLANIFICACION", "ACTIVO", "COMPLETADO", "EN_ESPERA", "CANCELADO"] as const;
type ProjectStatus = typeof PROJECT_STATUSES[number];

interface ProjectTeamMember { name: string; avatarUrl: string; avatarFallback: string; dataAiHint?: string }
interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  clientName?: string;
  team?: ProjectTeamMember[];
  progress?: number; // 0-100
  deadline?: string;
}

const initialProjectsData: Project[] = [
  {
    id: "proj-1",
    name: "Lanzamiento App Móvil Conecta Hub",
    description: "Desarrollo y lanzamiento de la aplicación móvil nativa para iOS y Android.",
    status: "ACTIVO",
    clientName: "Interno",
    team: [
        { name: "Elena Vasquez", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", avatarFallback: "EV" },
        { name: "Marco Chen", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "asian man", avatarFallback: "MC" }
    ],
    progress: 65,
    deadline: "2024-10-31",
  },
  {
    id: "proj-2",
    name: "Integración CRM para Cliente Alfa",
    description: "Conectar el sistema CRM del cliente con nuestra plataforma.",
    status: "PLANIFICACION",
    clientName: "Cliente Alfa Corp.",
    progress: 10,
    deadline: "2024-11-15",
  },
  {
    id: "proj-3",
    name: "Campaña de Marketing Q3",
    description: "Ejecución de la campaña de marketing digital para el tercer trimestre.",
    status: "COMPLETADO",
    clientName: "Interno",
    team: [{ name: "Sofia Reyes", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "latina woman", avatarFallback: "SR" }],
    progress: 100,
    deadline: "2024-07-30",
  },
  {
    id: "proj-4",
    name: "Actualización Infraestructura Servidores",
    status: "EN_ESPERA",
    description: "Migración a nuevos servidores y actualización de software base.",
    progress: 0,
  },
  {
    id: "proj-5",
    name: "Investigación IA para Chatbots V2",
    status: "ACTIVO",
    description: "Explorar nuevas tecnologías de IA para la próxima versión de chatbots.",
    team: [{ name: "Dr. Alan Grant", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "scientist man", avatarFallback: "AG" }],
    progress: 30,
    deadline: "2025-01-15",
  },
  {
    id: "proj-6",
    name: "Desarrollo de Nuevo Producto (Cancelado)",
    status: "CANCELADO",
    description: "Proyecto cancelado debido a cambios en la estrategia de mercado.",
    progress: 5,
  }
];

const statusToColumnTitle: Record<ProjectStatus, string> = {
  PLANIFICACION: "Planificación",
  ACTIVO: "Activo",
  COMPLETADO: "Completado",
  EN_ESPERA: "En Espera",
  CANCELADO: "Cancelado",
};

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card className="mb-3 shadow-md hover:shadow-lg transition-shadow bg-card">
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-semibold leading-tight">{project.name}</CardTitle>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
              <DropdownMenuItem>Editar Proyecto</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">Eliminar</DropdownMenuItem>
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
            {project.team.map(member => (
              <Avatar key={member.name} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.dataAiHint || "avatar person"} />
                <AvatarFallback className="text-xs">{member.avatarFallback}</AvatarFallback>
              </Avatar>
            ))}
            <span className="pl-3 text-xs text-muted-foreground">({project.team.length} {project.team.length === 1 ? 'miembro' : 'miembros'})</span>
          </div>
        )}
        {project.progress !== undefined && (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-muted-foreground">Progreso:</p>
                    <p className="text-xs font-semibold text-primary">{project.progress}%</p>
                </div>
                <Progress value={project.progress} className="h-2" />
            </div>
        )}
      </CardContent>
       <CardFooter className="p-3 pt-2 border-t flex justify-end">
         <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
            <GripVertical className="h-4 w-4" />
            <span className="sr-only">Arrastrar proyecto</span>
         </Button>
      </CardFooter>
    </Card>
  );
};

export default function CrmProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>(initialProjectsData);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);

  // Form state for adding project
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>("PLANIFICACION");
  const [newProjectClientName, setNewProjectClientName] = useState("");
  const [newProjectTeam, setNewProjectTeam] = useState(""); // Simple text input for now
  const [newProjectProgress, setNewProjectProgress] = useState<number | string>(0);
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  
  const resetAddProjectForm = () => {
    setNewProjectName("");
    setNewProjectDescription("");
    setNewProjectStatus("PLANIFICACION");
    setNewProjectClientName("");
    setNewProjectTeam("");
    setNewProjectProgress(0);
    setNewProjectDeadline("");
  };

  const handleAddProjectSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const progressValue = parseInt(String(newProjectProgress), 10);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
        toast({ title: "Invalid Progress", description: "Progress must be a number between 0 and 100.", variant: "destructive" });
        return;
    }

    const teamMembers: ProjectTeamMember[] = newProjectTeam
        .split(',')
        .map(name => name.trim())
        .filter(name => name)
        .map(name => ({
            name,
            avatarUrl: `https://placehold.co/40x40.png?text=${name[0]}`,
            avatarFallback: name.substring(0,2).toUpperCase(),
            dataAiHint: "avatar person"
        }));

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      description: newProjectDescription || undefined,
      status: newProjectStatus,
      clientName: newProjectClientName || undefined,
      team: teamMembers.length > 0 ? teamMembers : undefined,
      progress: progressValue,
      deadline: newProjectDeadline || undefined,
    };
    
    console.log("New Project Data:", newProject);
    setProjects(prevProjects => [...prevProjects, newProject]);
    toast({ title: "Project Added (Demo)", description: `Project "${newProject.name}" has been added.` });
    resetAddProjectForm();
    setIsAddProjectDialogOpen(false);
  };


  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Briefcase className="mr-3 h-8 w-8 text-primary"/>Projects Management</h1>
          <p className="text-muted-foreground">
            Supervisa tus proyectos desde la planificación hasta la finalización en este tablero Kanban.
          </p>
        </div>
        <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsAddProjectDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                    <DialogDescription>Enter the details for the new project.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProjectSubmit}>
                    <ScrollArea className="max-h-[60vh] p-1">
                        <div className="grid gap-4 py-4 pr-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="projectName" className="text-right col-span-1">Project Name</Label>
                                <Input id="projectName" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g., Q4 Marketing Campaign" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="projectDescription" className="text-right col-span-1 pt-2">Description</Label>
                                <Textarea id="projectDescription" value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="Describe the project scope and goals" className="col-span-3" rows={3}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="projectStatus" className="text-right col-span-1">Status</Label>
                                <Select value={newProjectStatus} onValueChange={(value: ProjectStatus) => setNewProjectStatus(value)}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        {PROJECT_STATUSES.map(status => <SelectItem key={status} value={status}>{statusToColumnTitle[status]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="projectClient" className="text-right col-span-1">Client Name</Label>
                                <Input id="projectClient" value={newProjectClientName} onChange={(e) => setNewProjectClientName(e.target.value)} placeholder="e.g., Client Company Inc." className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="projectTeam" className="text-right col-span-1">Team Members</Label>
                                <Input id="projectTeam" value={newProjectTeam} onChange={(e) => setNewProjectTeam(e.target.value)} placeholder="e.g., John, Jane, Mike" className="col-span-3" />
                                <p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated names.</p>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="projectProgress" className="text-right col-span-1">Progress (%)</Label>
                                <Input id="projectProgress" type="number" value={newProjectProgress} onChange={(e) => setNewProjectProgress(e.target.value)} placeholder="0-100" className="col-span-3" min="0" max="100"/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="projectDeadline" className="text-right col-span-1">Deadline</Label>
                                <div className="col-span-3 relative">
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="projectDeadline" type="date" value={newProjectDeadline} onChange={(e) => setNewProjectDeadline(e.target.value)} className="pl-10" />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4 border-t">
                        <DialogClose asChild><Button type="button" variant="outline" onClick={resetAddProjectForm}>Cancel</Button></DialogClose>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Project</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

       <p className="text-sm text-muted-foreground">
        Nota: La funcionalidad de arrastrar y soltar (Drag & Drop) para mover proyectos entre columnas se implementará en un paso futuro.
      </p>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {PROJECT_STATUSES.map((statusKey) => (
            <Card key={statusKey} className="w-[320px] flex-shrink-0 flex flex-col bg-muted/40 shadow-md">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-md font-semibold flex justify-between items-center">
                  {statusToColumnTitle[statusKey]}
                   <Badge variant="secondary" className="text-xs">
                    {projects.filter(p => p.status === statusKey).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="p-3">
                   {projects.filter(p => p.status === statusKey).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No hay proyectos en este estado.</p>
                  )}
                  {projects
                    .filter(p => p.status === statusKey)
                    .map(project => (
                      <ProjectCard key={project.id} project={project} />
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

    