"use server";

import {
  PrismaClient,
  Prisma,
  type TaskStatus,
  type TaskPriority,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getLeadsForSelect as getLeadsForSelectFromLeadsModule } from "@/app/(app)/crm/leads/actions";
import { getProjectsForSelect as getProjectsForSelectFromProjectsModule } from "@/app/(app)/crm/projects/actions";
import {
  TaskFormSchema,
  type TaskFormValues,
} from "@/lib/schemas/crm/task-schema";
import { getCurrentUserWithTenant } from "@/lib/session";

const prisma = new PrismaClient();

export interface TaskFE {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: Date | null;
  priority?: TaskPriority | null;
  assignedTo?: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
    dataAiHint?: string;
  } | null;
  relatedToLead?: { id: string; name: string } | null;
  relatedToProject?: { id: string; name: string } | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  dataAiHint?: string;
}

// Helper function to manage tags (connect or create)
async function manageTaskTags(
  prismaTx: Prisma.TransactionClient,
  taskId: string,
  tagNamesString: string | undefined | null,
  tenantId: string
) {
  await prismaTx.taskTag.deleteMany({
    where: { taskId, tenantId },
  });

  if (tagNamesString && tagNamesString.trim() !== "") {
    const tagNamesArray = tagNamesString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (tagNamesArray.length > 0) {
      const tagOperations = tagNamesArray.map((name) =>
        prismaTx.tag.upsert({
          where: { tenantId_name: { tenantId, name } },
          update: {},
          create: { name, tenantId },
        })
      );
      const createdOrFoundTags = await Promise.all(tagOperations);

      await prismaTx.taskTag.createMany({
        data: createdOrFoundTags.map((tag) => ({
          taskId,
          tagId: tag.id,
          tenantId,
        })),
        skipDuplicates: true,
      });
    }
  }
}

export async function getTasks(): Promise<TaskFE[]> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error("No tenant found - please check your domain configuration");
    }
    const tasksFromDb = await prisma.task.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      include: {
        assignedTo: {
          select: {
            userId: true,
            user: { select: { fullName: true, email: true, avatarUrl: true } },
          },
        },
        relatedToLead: { select: { id: true, name: true } },
        relatedToProject: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return tasksFromDb.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo.userId,
            name: task.assignedTo.user.fullName || task.assignedTo.user.email,
            avatarUrl: task.assignedTo.user.avatarUrl,
            dataAiHint: "avatar person",
          }
        : null,
      relatedToLead: task.relatedToLead
        ? { id: task.relatedToLead.id, name: task.relatedToLead.name }
        : null,
      relatedToProject: task.relatedToProject
        ? { id: task.relatedToProject.id, name: task.relatedToProject.name }
        : null,
      tags: task.tags.map((tt) => tt.tag.name),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dataAiHint: "task checkmark",
    }));
  } catch (error) {
    console.error("Prisma error in getTasks:", error);
    throw new Error("Could not fetch tasks. Database operation failed.");
  }
}

export async function createTask(data: TaskFormValues): Promise<TaskFE> {
  const validation = TaskFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "CreateTask Validation Error:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid task data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }
  const { tagNames, dueDate, ...taskData } = validation.data;

  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error("No tenant found - please check your domain configuration");
    }
    const newTask = await prisma.$transaction(async (prismaTx) => {
      const created = await prismaTx.task.create({
        data: {
          ...taskData,
          dueDate: dueDate ? new Date(dueDate) : null,
          tenantId: user.tenantId,
          assignedToUserId: taskData.assignedToUserId || null,
          relatedToLeadId: taskData.relatedToLeadId || null,
          relatedToProjectId: taskData.relatedToProjectId || null,
          priority: taskData.priority || null,
        },
      });
      await manageTaskTags(prismaTx, created.id, tagNames, user.tenantId);
      return created;
    });

    revalidatePath("/crm/tasks");
    // Fetch the created task with relations to match TaskFE structure
    const result = await prisma.task.findUniqueOrThrow({
      where: { id: newTask.id },
      include: {
        assignedTo: {
          select: {
            userId: true,
            user: { select: { fullName: true, email: true, avatarUrl: true } },
          },
        },
        relatedToLead: { select: { id: true, name: true } },
        relatedToProject: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status,
      dueDate: result.dueDate,
      priority: result.priority,
      assignedTo: result.assignedTo
        ? {
            id: result.assignedTo.userId,
            name:
              result.assignedTo.user.fullName || result.assignedTo.user.email,
            avatarUrl: result.assignedTo.user.avatarUrl,
            dataAiHint: "avatar person",
          }
        : null,
      relatedToLead: result.relatedToLead
        ? { id: result.relatedToLead.id, name: result.relatedToLead.name }
        : null,
      relatedToProject: result.relatedToProject
        ? { id: result.relatedToProject.id, name: result.relatedToProject.name }
        : null,
      tags: result.tags.map((tt) => tt.tag.name),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      dataAiHint: "task checkmark",
    };
  } catch (error) {
    console.error("Prisma error in createTask:", error);
    throw new Error("Could not create task. Database operation failed.");
  }
}

export async function updateTask(
  id: string,
  data: TaskFormValues
): Promise<TaskFE> {
  const validation = TaskFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "UpdateTask Validation Error:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid task data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }
  const { tagNames, dueDate, ...taskData } = validation.data;

  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error("No tenant found - please check your domain configuration");
    }
    const updatedTask = await prisma.$transaction(async (prismaTx) => {
      const updated = await prismaTx.task.update({
        where: { id, tenantId: user.tenantId, deletedAt: null },
        data: {
          ...taskData,
          dueDate: dueDate ? new Date(dueDate) : null,
          assignedToUserId: taskData.assignedToUserId || null,
          relatedToLeadId: taskData.relatedToLeadId || null,
          relatedToProjectId: taskData.relatedToProjectId || null,
          priority: taskData.priority || null,
          updatedAt: new Date(),
        },
      });
      await manageTaskTags(prismaTx, updated.id, tagNames, user.tenantId);
      return updated;
    });

    revalidatePath("/crm/tasks");
    const result = await prisma.task.findUniqueOrThrow({
      where: { id: updatedTask.id },
      include: {
        assignedTo: {
          select: {
            userId: true,
            user: { select: { fullName: true, email: true, avatarUrl: true } },
          },
        },
        relatedToLead: { select: { id: true, name: true } },
        relatedToProject: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status,
      dueDate: result.dueDate,
      priority: result.priority,
      assignedTo: result.assignedTo
        ? {
            id: result.assignedTo.userId,
            name:
              result.assignedTo.user.fullName || result.assignedTo.user.email,
            avatarUrl: result.assignedTo.user.avatarUrl,
            dataAiHint: "avatar person",
          }
        : null,
      relatedToLead: result.relatedToLead
        ? { id: result.relatedToLead.id, name: result.relatedToLead.name }
        : null,
      relatedToProject: result.relatedToProject
        ? { id: result.relatedToProject.id, name: result.relatedToProject.name }
        : null,
      tags: result.tags.map((tt) => tt.tag.name),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      dataAiHint: "task checkmark",
    };
  } catch (error) {
    console.error(`Prisma error in updateTask for ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Task with ID ${id} not found or has been deleted.`);
    }
    throw new Error("Could not update task. Database operation failed.");
  }
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<TaskFE> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error("No tenant found - please check your domain configuration");
    }
    const updatedTask = await prisma.task.update({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      data: { status, updatedAt: new Date() },
    });
    revalidatePath("/crm/tasks");
    const result = await prisma.task.findUniqueOrThrow({
      where: { id: updatedTask.id },
      include: {
        assignedTo: {
          select: {
            userId: true,
            user: { select: { fullName: true, email: true, avatarUrl: true } },
          },
        },
        relatedToLead: { select: { id: true, name: true } },
        relatedToProject: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status,
      dueDate: result.dueDate,
      priority: result.priority,
      assignedTo: result.assignedTo
        ? {
            id: result.assignedTo.userId,
            name:
              result.assignedTo.user.fullName || result.assignedTo.user.email,
            avatarUrl: result.assignedTo.user.avatarUrl,
            dataAiHint: "avatar person",
          }
        : null,
      relatedToLead: result.relatedToLead
        ? { id: result.relatedToLead.id, name: result.relatedToLead.name }
        : null,
      relatedToProject: result.relatedToProject
        ? { id: result.relatedToProject.id, name: result.relatedToProject.name }
        : null,
      tags: result.tags.map((tt) => tt.tag.name),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      dataAiHint: "task checkmark",
    };
  } catch (error) {
    console.error(`Prisma error in updateTaskStatus for ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Task with ID ${id} not found or has been deleted.`);
    }
    throw new Error("Could not update task status. Database operation failed.");
  }
}

export async function deleteTask(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      return {
        success: false,
        message: "No tenant found - please check your domain configuration",
      };
    }
    await prisma.task.update({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/crm/tasks");
    return { success: true };
  } catch (error) {
    console.error(`Prisma error in deleteTask for ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: `Task with ID ${id} not found or already deleted.`,
      };
    }
    return {
      success: false,
      message: "Could not delete task. Database operation failed.",
    };
  }
}

export async function getUsersForTasks(): Promise<
  { id: string; name: string | null }[]
> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error("No tenant found - please check your domain configuration");
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
    console.error("Prisma error in getUsersForTasks:", error);
    throw new Error(
      "Could not fetch users for assignment. Database operation failed."
    );
  }
}

export async function getLeadsForTasks(): Promise<
  { id: string; name: string }[]
> {
  return getLeadsForSelectFromLeadsModule();
}

export async function getProjectsForTasks(): Promise<
  { id: string; name: string }[]
> {
  return getProjectsForSelectFromProjectsModule();
}
