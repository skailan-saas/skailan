
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Briefcase, Users, GripVertical, MoreHorizontal, Percent } from "lucide-react";
import { useState, type FC } from "react";
import { Progress } from "@/components/ui/progress";


// Based on Prisma ProjectStatus enum
const PROJECT_STATUSES = ["PLANIFICACION", "ACTIVO", "COMPLETADO", "EN_ESPERA", "CANCELADO"] as const;
type ProjectStatus = typeof PROJECT_STATUSES[number];

interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  clientName?: string;
  team?: { name: string; avatarUrl: string; avatarFallback: string; dataAiHint?: string }[];
  progress?: number; // 0-100
  deadline?: string;
}

const initialProjects: Project[] = [
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
        {project.deadline && <p className="text-xs text-muted-foreground">Fecha Límite: {project.deadline}</p>}
        {project.team && project.team.length > 0 && (
          <div className="flex items-center -space-x-2">
            {project.team.map(member => (
              <Avatar key={member.name} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.dataAiHint || "avatar person"} />
                <AvatarFallback className="text-xs">{member.avatarFallback}</AvatarFallback>
              </Avatar>
            ))}
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
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  // Placeholder for drag-and-drop logic
  // const handleDragEnd = (result: any) => { /* ... */ };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Briefcase className="mr-3 h-8 w-8 text-primary"/>Projects Management</h1>
          <p className="text-muted-foreground">
            Supervisa tus proyectos desde la planificación hasta la finalización en este tablero Kanban.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Project
        </Button>
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
