
'use server';

import { PrismaClient, type Prisma, type ProjectStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const prisma = new PrismaClient();

// IMPORTANT: Replace with actual tenantId from user session or context
const tenantIdPlaceholder = "your-tenant-id"; 

const ProjectStatusEnum = z.enum(["PLANNING", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELED"]);

const ProjectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  status: ProjectStatusEnum,
  companyId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(), // Lead ID acting as Opportunity ID
  startDate: z.string().optional().nullable(), 
  endDate: z.string().optional().nullable(),
  budget: z.preprocess( // Handle empty string for optional number
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().nonnegative("Budget must be a positive number").optional().nullable()
  ),
  teamMemberIds: z.array(z.string()).optional(), 
  tagNames: z.array(z.string()).optional(), 
});

export type ProjectFormValues = z.infer<typeof ProjectFormSchema>;

export interface ProjectFE {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: number | null;
  companyId?: string | null;
  companyName?: string | null;
  opportunityId?: string | null;
  opportunityName?: string | null;
  teamMembers: { id: string; name: string | null; avatarUrl?: string | null; dataAiHint?: string; }[];
  tags: string[];
  tasksCount?: number; 
  createdAt: Date;
  updatedAt: Date;
  dataAiHint?: string;
}

async function manageProjectTags(prismaTx: Prisma.TransactionClient, projectId: string, tagNames: string[] | undefined, tenantId: string) {
  await prismaTx.projectTag.deleteMany({ where: { projectId, tenantId } });
  if (tagNames && tagNames.length > 0) {
    const tagOperations = tagNames.map(name => 
      prismaTx.tag.upsert({
        where: { tenantId_name: { tenantId, name } },
        update: {},
        create: { name, tenantId },
      })
    );
    const createdOrFoundTags = await Promise.all(tagOperations);
    
    await prismaTx.projectTag.createMany({
      data: createdOrFoundTags.map(tag => ({
        projectId,
        tagId: tag.id,
        tenantId,
      })),
      skipDuplicates: true, 
    });
  }
}

async function manageProjectTeamMembers(prismaTx: Prisma.TransactionClient, projectId: string, teamMemberIds: string[] | undefined, tenantId: string) {
  await prismaTx.projectTeamMember.deleteMany({ where: { projectId, tenantId } });
  if (teamMemberIds && teamMemberIds.length > 0) {
    await prismaTx.projectTeamMember.createMany({
      data: teamMemberIds.map(userId => ({
        projectId,
        userId, // This userId should be the ID from the User table, which TenantUser.userId references
        tenantId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function getProjects(): Promise<ProjectFE[]> {
  // IMPORTANT: Replace tenantIdPlaceholder with actual tenant ID logic
  try {
    const projectsFromDb = await prisma.project.findMany({
      where: { tenantId: tenantIdPlaceholder, deletedAt: null },
      include: {
        company: { select: { name: true } },
        opportunity: { select: { name: true } }, 
        tags: { include: { tag: { select: { name: true } } } },
        teamMembers: { 
          include: { 
            member: { select: { userId: true, user: {select: {fullName: true, email:true, avatarUrl: true}} } } 
          } 
        },
        _count: { select: { tasks: true } } 
      },
      orderBy: { createdAt: 'desc' },
    });

    return projectsFromDb.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      budget: p.budget,
      companyId: p.companyId,
      companyName: p.company?.name,
      opportunityId: p.opportunityId,
      opportunityName: p.opportunity?.name,
      teamMembers: p.teamMembers.map(tm => ({
        id: tm.member.userId, // Use the user's actual ID
        name: tm.member.user.fullName || tm.member.user.email,
        avatarUrl: tm.member.user.avatarUrl,
        dataAiHint: "avatar person" 
      })),
      tags: p.tags.map(pt => pt.tag.name),
      tasksCount: p._count.tasks,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      dataAiHint: "project folder" 
    }));
  } catch (error) {
    console.error("ERROR DETAILED getProjects:", error);
    throw new Error("Could not fetch projects.");
  }
}

export async function createProject(data: ProjectFormValues): Promise<ProjectFE> {
  // IMPORTANT: Replace tenantIdPlaceholder with actual tenant ID logic
  const validation = ProjectFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid project data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { tagNames, teamMemberIds, startDate, endDate, ...projectData } = validation.data;

  try {
    const newProject = await prisma.$transaction(async (prismaTx) => {
      const created = await prismaTx.project.create({
        data: {
          ...projectData,
          tenantId: tenantIdPlaceholder,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          budget: projectData.budget ?? null,
        },
      });
      
      await manageProjectTags(prismaTx, created.id, tagNames, tenantIdPlaceholder);
      await manageProjectTeamMembers(prismaTx, created.id, teamMemberIds, tenantIdPlaceholder);
      
      return created;
    });

    revalidatePath('/crm/projects');
    const result = await getProjects(); // Re-fetch to get populated relations
    const found = result.find(p => p.id === newProject.id);
    if (!found) throw new Error("Failed to retrieve created project with full details.");
    return found;

  } catch (error) {
    console.error("Failed to create project:", error);
    throw new Error("Could not create project.");
  }
}

export async function updateProject(id: string, data: ProjectFormValues): Promise<ProjectFE> {
  // IMPORTANT: Replace tenantIdPlaceholder with actual tenant ID logic
  const validation = ProjectFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid project data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { tagNames, teamMemberIds, startDate, endDate, ...projectData } = validation.data;

  try {
    const updatedProject = await prisma.$transaction(async (prismaTx) => {
      const updated = await prismaTx.project.update({
        where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
        data: {
          ...projectData,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          budget: projectData.budget ?? null,
          updatedAt: new Date(),
        },
      });
      
      await manageProjectTags(prismaTx, id, tagNames, tenantIdPlaceholder);
      await manageProjectTeamMembers(prismaTx, id, teamMemberIds, tenantIdPlaceholder);
      
      return updated;
    });
    
    revalidatePath('/crm/projects');
    const result = await getProjects(); 
    const found = result.find(p => p.id === updatedProject.id);
    if (!found) throw new Error("Failed to retrieve updated project with full details.");
    return found;

  } catch (error) {
    console.error(`Failed to update project ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error(`Project with ID ${id} not found or has been deleted.`);
    }
    throw new Error("Could not update project.");
  }
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<ProjectFE> {
    // IMPORTANT: Replace tenantIdPlaceholder with actual tenant ID logic
    try {
      const updatedProject = await prisma.project.update({
        where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
        data: { status, updatedAt: new Date() },
      });
      revalidatePath('/crm/projects');
      const result = await getProjects();
      const found = result.find(p => p.id === updatedProject.id);
      if (!found) throw new Error("Failed to retrieve updated project after status change.");
      return found;
    } catch (error) {
      console.error(`Failed to update project status ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error(`Project with ID ${id} not found or has been deleted.`);
      }
      throw new Error("Could not update project status.");
    }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message?: string }> {
  // IMPORTANT: Replace tenantIdPlaceholder with actual tenant ID logic
  try {
    await prisma.project.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/crm/projects');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete project ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, message: `Project with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete project." };
  }
}

// Function to get projects for select components
export async function getProjectsForSelect(): Promise<{ id: string; name: string }[]> {
    // IMPORTANT: Replace tenantIdPlaceholder with actual tenant ID logic
    try {
      const projects = await prisma.project.findMany({
        where: {
          tenantId: tenantIdPlaceholder,
          deletedAt: null,
          // Optionally filter by active statuses
          // status: { in: ['PLANNING', 'ACTIVE', 'ON_HOLD'] } 
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return projects;
    } catch (error) {
      console.error("Failed to fetch projects for select:", error);
      throw new Error("Could not fetch projects for selection.");
    }
}


// Re-export from leads/actions.ts for convenience if needed by Project forms/pages
export { getLeadsForSelect } from '@/app/(app)/crm/leads/actions';

// Re-export from a central user actions file or define here if specific to project context
export async function getUsersForSelect(): Promise<{ id: string; name: string | null }[]> {
    // IMPORTANT: Replace tenantIdPlaceholder with actual tenant ID logic
    try {
      const users = await prisma.tenantUser.findMany({
        where: { tenantId: tenantIdPlaceholder },
        select: { userId: true, user: { select: { fullName: true, email: true } } }, 
        orderBy: { user: { fullName: 'asc' } },
      });
      return users.map(tu => ({
        id: tu.userId, 
        name: tu.user.fullName || tu.user.email,
      }));
    } catch (error) {
      console.error("Failed to fetch users for select:", error);
      throw new Error("Could not fetch users for selection.");
    }
}
