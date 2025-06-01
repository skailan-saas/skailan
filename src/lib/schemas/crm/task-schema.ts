
import { z } from 'zod';
import type { TaskStatus as PrismaTaskStatus, TaskPriority as PrismaTaskPriority } from '@prisma/client';

// Client-side enums for forms, matching Prisma enums
export const TaskStatusEnumClient = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]);
export const TaskPriorityEnumClient = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: TaskStatusEnumClient,
  dueDate: z.string().optional().nullable(), // Dates as strings from form, convert in action
  priority: TaskPriorityEnumClient.optional().nullable(),
  assignedToUserId: z.string().optional().nullable(),
  relatedToLeadId: z.string().optional().nullable(),
  relatedToProjectId: z.string().optional().nullable(),
  tagNames: z.string().optional().nullable(), // Comma-separated string for tags
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;
