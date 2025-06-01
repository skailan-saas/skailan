'use server';

import { PrismaClient, type Prisma, type TaskStatus, type TaskPriority } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getLeadsForSelect } from '@/app/(app)/crm/leads/actions'; // For opportunity linking
import { getProjectsForSelect } from '@/app/(app)/crm/projects/actions'; // For project linking

const prisma = new PrismaClient();

// IMPORTANT: Replace with actual tenantId from user session or context
const tenantIdPlaceholder = "your-tenant-id"; 

const TaskStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]);
const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: TaskStatusEnum,
  dueDate: z.string().optional().nullable(), // Dates as strings, convert in action
  priority: TaskPriorityEnum.optional().nullable(),
  assignedToUserId: z.string().optional().nullable(),
  relatedToLeadId: z.string().optional().nullable(), // Lead ID acting as Opportunity ID
  relatedToProjectId: z.string().optional().nullable(),
  tagNames: z.string().optional(), // Comma-separated string for tags
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

export interface TaskFE {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: Date | null;
  priority?: TaskPriority | null;
  assignedTo?: { id: string; name: string | null; avatarUrl?: string | null; dataAiHint?: string } | null;
  relatedToLead?: { id: string; name: string } | null;
  relatedToProject?: { id: string; name: string } | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  dataAiHint?: string;
}

// Helper function to manage tags (connect or create)
async function manageTaskTags(prismaTx: Prisma.TransactionClient, taskId: string, tagNamesString: string | undefined, tenantId: string) {
  // Delete existing tags for this task
  await prismaTx.taskTag.deleteMany({
    where: { taskId, tenantId },
  });

  if (tagNamesString && tagNamesString.trim() !== "") {
    const tagNamesArray = tagNamesString.split(',').map(t => t.trim()).filter(t => t);
    if (tagNamesArray.length > 0) {
      const tagOperations = tagNamesArray.map(name =>
        prismaTx.tag.upsert({
          where: { tenantId_name: { tenantId, name } },
          update: {},
          create: { name, tenantId },
        })
      );
      const createdOrFoundTags = await Promise.all(tagOperations);

      await prismaTx.taskTag.createMany({
        data: createdOrFoundTags.map(tag => ({
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
    const tasksFromDb = await prisma.task.findMany({
      where: { tenantId: tenantIdPlaceholder, deletedAt: null },
      include: {
        assignedTo: { select: { userId: true, user: { select: { fullName: true, email: true, avatarUrl: true } } } },
        relatedToLead: { select: { id: true, name: true } }, // Lead (as Opportunity)
        relatedToProject: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasksFromDb.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
      assignedTo: task.assignedTo ? { 
        id: task.assignedTo.userId, 
        name: task.assignedTo.user.fullName || task.assignedTo.user.email,
        avatarUrl: task.assignedTo.user.avatarUrl,
        dataAiHint: "avatar person"
      } : null,
      relatedToLead: task.relatedToLead ? { id: task.relatedToLead.id, name: task.relatedToLead.name } : null,
      relatedToProject: task.relatedToProject ? { id: task.relatedToProject.id, name: task.relatedToProject.name } : null,
      tags: task.tags.map(tt => tt.tag.name),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dataAiHint: "task checkmark" 
    }));
  } catch (error) {
    console.error("ERROR DETAILED getTasks:", error);
    throw new Error("Could not fetch tasks.");
  }
}

export async function createTask(data: TaskFormValues): Promise<TaskFE> {
  const validation = TaskFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid task data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { tagNames, dueDate, ...taskData } = validation.data;

  try {
    const newTask = await prisma.$transaction(async (prismaTx) => {
      const created = await prismaTx.task.create({
        data: {
          ...taskData,
          dueDate: dueDate ? new Date(dueDate) : null,
          tenantId: tenantIdPlaceholder,
        },
      });
      await manageTaskTags(prismaTx, created.id, tagNames, tenantIdPlaceholder);
      return created;
    });
    
    revalidatePath('/crm/tasks');
    // Fetch the created task with relations to match TaskFE structure
    const result = await getTasks(); // Re-fetch all to get the new one with populated relations
    const found = result.find(t => t.id === newTask.id);
    if (!found) throw new Error("Failed to retrieve created task with full details.");
    return found;

  } catch (error) {
    console.error("Failed to create task:", error);
    throw new Error("Could not create task.");
  }
}

export async function updateTask(id: string, data: TaskFormValues): Promise<TaskFE> {
  const validation = TaskFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid task data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { tagNames, dueDate, ...taskData } = validation.data;

  try {
    const updatedTask = await prisma.$transaction(async (prismaTx) => {
      const updated = await prismaTx.task.update({
        where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
        data: {
          ...taskData,
          dueDate: dueDate ? new Date(dueDate) : null,
          updatedAt: new Date(),
        },
      });
      await manageTaskTags(prismaTx, updated.id, tagNames, tenantIdPlaceholder);
      return updated;
    });

    revalidatePath('/crm/tasks');
    const result = await getTasks(); 
    const found = result.find(t => t.id === updatedTask.id);
    if (!found) throw new Error("Failed to retrieve updated task with full details.");
    return found;

  } catch (error) {
    console.error(`Failed to update task ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error(`Task with ID ${id} not found or has been deleted.`);
    }
    throw new Error("Could not update task.");
  }
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskFE> {
    try {
      const updatedTask = await prisma.task.update({
        where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
        data: { status, updatedAt: new Date() },
      });
      revalidatePath('/crm/tasks');
      const result = await getTasks();
      const found = result.find(t => t.id === updatedTask.id);
      if (!found) throw new Error("Failed to retrieve task after status update.");
      return found;
    } catch (error) {
      console.error(`Failed to update task status for ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error(`Task with ID ${id} not found or has been deleted.`);
      }
      throw new Error("Could not update task status.");
    }
}


export async function deleteTask(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.task.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/crm/tasks');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete task ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, message: `Task with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete task." };
  }
}

export async function getUsersForTasks(): Promise<{ id: string; name: string | null }[]> {
    // IMPORTANT: Replace with actual tenantId from user session or context
    // const tenantIdPlaceholder = "your-tenant-id"; 
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
      console.error("Failed to fetch users for tasks:", error);
      throw new Error("Could not fetch users for assignment.");
    }
}

export async function getLeadsForTasks(): Promise<{ id: string; name: string }[]> {
    return getLeadsForSelect(); // Re-use existing function
}

export async function getProjectsForTasks(): Promise<{ id: string; name: string }[]> {
    return getProjectsForSelect(); // Re-use from projects/actions
}