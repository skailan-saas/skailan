"use server";

import { PrismaClient, Prisma, type ProjectStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLeadsForSelect as getLeadsForSelectFromLeadsModule } from "@/app/(app)/crm/leads/actions";
import { getCurrentUserWithTenant } from "@/lib/session";

const prisma = new PrismaClient();

const ProjectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "ON_HOLD",
  "CANCELED",
]);

const ProjectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  status: ProjectStatusEnum,
  companyId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(), // Lead ID acting as Opportunity ID
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.preprocess(
    // Handle empty string for optional number
    (val) =>
      val === "" || val === null || val === undefined ? null : Number(val),
    z
      .number()
      .nonnegative("Budget must be a positive number")
      .optional()
      .nullable()
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
  teamMembers: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
    dataAiHint?: string;
  }[];
  tags: string[];
  tasksCount?: number;
  createdAt: Date;
  updatedAt: Date;
  dataAiHint?: string;
}

async function manageProjectTags(
  prismaTx: Prisma.TransactionClient,
  projectId: string,
  tagNames: string[] | undefined,
  tenantId: string
) {
  await prismaTx.projectTag.deleteMany({ where: { projectId, tenantId } });
  if (tagNames && tagNames.length > 0) {
    const tagOperations = tagNames.map((name) =>
      prismaTx.tag.upsert({
        where: { tenantId_name: { tenantId, name } },
        update: {},
        create: { name, tenantId },
      })
    );
    const createdOrFoundTags = await Promise.all(tagOperations);

    await prismaTx.projectTag.createMany({
      data: createdOrFoundTags.map((tag) => ({
        projectId,
        tagId: tag.id,
        tenantId,
      })),
      skipDuplicates: true,
    });
  }
}

async function manageProjectTeamMembers(
  prismaTx: Prisma.TransactionClient,
  projectId: string,
  teamMemberIds: string[] | undefined,
  tenantId: string
) {
  await prismaTx.projectTeamMember.deleteMany({
    where: { projectId, tenantId },
  });
  if (teamMemberIds && teamMemberIds.length > 0) {
    await prismaTx.projectTeamMember.createMany({
      data: teamMemberIds.map((userId) => ({
        projectId,
        userId,
        tenantId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function getProjects(): Promise<ProjectFE[]> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }
    const projectsFromDb = await prisma.project.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      include: {
        company: { select: { name: true } },
        opportunity: { select: { name: true } }, // This refers to Lead model as Opportunity
        tags: { include: { tag: { select: { name: true } } } },
        teamMembers: {
          include: {
            member: {
              select: {
                userId: true,
                user: {
                  select: { fullName: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return projectsFromDb.map((p) => ({
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
      teamMembers: p.teamMembers.map((tm) => ({
        id: tm.member.userId,
        name: tm.member.user.fullName || tm.member.user.email,
        avatarUrl: tm.member.user.avatarUrl,
        dataAiHint: "avatar person",
      })),
      tags: p.tags.map((pt) => pt.tag.name),
      tasksCount: p._count.tasks,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      dataAiHint: "project folder",
    }));
  } catch (error) {
    console.error("Prisma error in getProjects:", error);
    throw new Error("Could not fetch projects. Database operation failed.");
  }
}

export async function createProject(
  data: ProjectFormValues
): Promise<ProjectFE> {
  const validation = ProjectFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "CreateProject Validation Error:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid project data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }
  const { tagNames, teamMemberIds, startDate, endDate, ...projectData } =
    validation.data;

  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }
    const newProject = await prisma.$transaction(async (prismaTx) => {
      const created = await prismaTx.project.create({
        data: {
          ...projectData,
          tenantId: user.tenantId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          budget: projectData.budget ?? null,
          companyId: projectData.companyId || null,
          opportunityId: projectData.opportunityId || null,
        },
      });

      await manageProjectTags(prismaTx, created.id, tagNames, user.tenantId);
      await manageProjectTeamMembers(
        prismaTx,
        created.id,
        teamMemberIds,
        user.tenantId
      );

      return created;
    });

    revalidatePath("/crm/projects");
    // Fetch the newly created project with all relations to match ProjectFE
    const result = await prisma.project.findUniqueOrThrow({
      where: { id: newProject.id },
      include: {
        company: { select: { name: true } },
        opportunity: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
        teamMembers: {
          include: {
            member: {
              select: {
                userId: true,
                user: {
                  select: { fullName: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      budget: result.budget,
      companyId: result.companyId,
      companyName: result.company?.name,
      opportunityId: result.opportunityId,
      opportunityName: result.opportunity?.name,
      teamMembers: result.teamMembers.map((tm) => ({
        id: tm.member.userId,
        name: tm.member.user.fullName || tm.member.user.email,
        avatarUrl: tm.member.user.avatarUrl,
        dataAiHint: "avatar person",
      })),
      tags: result.tags.map((pt) => pt.tag.name),
      tasksCount: result._count.tasks,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      dataAiHint: "project folder",
    };
  } catch (error) {
    console.error("Prisma error in createProject:", error);
    throw new Error("Could not create project. Database operation failed.");
  }
}

export async function updateProject(
  id: string,
  data: ProjectFormValues
): Promise<ProjectFE> {
  const user = await getCurrentUserWithTenant();
  if (!user || !user.tenantId) {
    throw new Error("No tenant found - please check your domain configuration");
  }
  const validation = ProjectFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "UpdateProject Validation Error:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid project data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }
  const { tagNames, teamMemberIds, startDate, endDate, ...projectData } =
    validation.data;

  try {
    const updatedProjectTx = await prisma.$transaction(async (prismaTx) => {
      const updated = await prismaTx.project.update({
        where: { id, tenantId: user.tenantId, deletedAt: null },
        data: {
          ...projectData,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          budget: projectData.budget ?? null,
          companyId: projectData.companyId || null,
          opportunityId: projectData.opportunityId || null,
          updatedAt: new Date(),
        },
      });

      await manageProjectTags(prismaTx, id, tagNames, user.tenantId);
      await manageProjectTeamMembers(prismaTx, id, teamMemberIds, user.tenantId);

      return updated;
    });

    revalidatePath("/crm/projects");
    const result = await prisma.project.findUniqueOrThrow({
      where: { id: updatedProjectTx.id },
      include: {
        company: { select: { name: true } },
        opportunity: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
        teamMembers: {
          include: {
            member: {
              select: {
                userId: true,
                user: {
                  select: { fullName: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      budget: result.budget,
      companyId: result.companyId,
      companyName: result.company?.name,
      opportunityId: result.opportunityId,
      opportunityName: result.opportunity?.name,
      teamMembers: result.teamMembers.map((tm) => ({
        id: tm.member.userId,
        name: tm.member.user.fullName || tm.member.user.email,
        avatarUrl: tm.member.user.avatarUrl,
        dataAiHint: "avatar person",
      })),
      tags: result.tags.map((pt) => pt.tag.name),
      tasksCount: result._count.tasks,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      dataAiHint: "project folder",
    };
  } catch (error) {
    console.error(`Prisma error in updateProject for ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Project with ID ${id} not found or has been deleted.`);
    }
    throw new Error("Could not update project. Database operation failed.");
  }
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<ProjectFE> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      data: { status, updatedAt: new Date() },
    });
    revalidatePath("/crm/projects");
    // Fetch the project with relations to match ProjectFE
    const result = await prisma.project.findUniqueOrThrow({
      where: { id: updatedProject.id },
      include: {
        company: { select: { name: true } },
        opportunity: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
        teamMembers: {
          include: {
            member: {
              select: {
                userId: true,
                user: {
                  select: { fullName: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      budget: result.budget,
      companyId: result.companyId,
      companyName: result.company?.name,
      opportunityId: result.opportunityId,
      opportunityName: result.opportunity?.name,
      teamMembers: result.teamMembers.map((tm) => ({
        id: tm.member.userId,
        name: tm.member.user.fullName || tm.member.user.email,
        avatarUrl: tm.member.user.avatarUrl,
        dataAiHint: "avatar person",
      })),
      tags: result.tags.map((pt) => pt.tag.name),
      tasksCount: result._count.tasks,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      dataAiHint: "project folder",
    };
  } catch (error) {
    console.error(`Prisma error in updateProjectStatus for ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Project with ID ${id} not found or has been deleted.`);
    }
    throw new Error(
      "Could not update project status. Database operation failed."
    );
  }
}

export async function deleteProject(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    await prisma.project.update({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/crm/projects");
    return { success: true };
  } catch (error) {
    console.error(`Prisma error in deleteProject for ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: `Project with ID ${id} not found or already deleted.`,
      };
    }
    return {
      success: false,
      message: "Could not delete project. Database operation failed.",
    };
  }
}

export async function getProjectsForSelect(): Promise<
  { id: string; name: string }[]
> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }
    const projects = await prisma.project.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return projects;
  } catch (error) {
    console.error("Prisma error in getProjectsForSelect:", error);
    throw new Error(
      "Could not fetch projects for selection. Database operation failed."
    );
  }
}

// Wrapper for getLeadsForSelect from leads/actions.ts to satisfy "use server" export rules.
export async function getLeadsForSelect(): Promise<
  { id: string; name: string }[]
> {
  return getLeadsForSelectFromLeadsModule();
}

export async function getUsersForSelect(): Promise<
  { id: string; name: string | null }[]
> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }
    const users = await prisma.tenantUser.findMany({
      where: { tenantId: user.tenantId },
      select: {
        userId: true,
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    });
    return users.map((tu) => ({
      id: tu.userId,
      name: tu.user.fullName || tu.user.email,
    }));
  } catch (error) {
    console.error(
      "Prisma error in getUsersForSelect (in projects/actions.ts):",
      error
    );
    throw new Error(
      "Could not fetch users for selection. Database operation failed."
    );
  }
}
