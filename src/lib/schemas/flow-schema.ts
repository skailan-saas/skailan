import { z } from "zod";

export const flowDefinitionSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum([
      "text",
      "image",
      "buttons",
      "carousel",
      "userInput",
      "condition",
      "action",
    ]),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.any()),
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    animated: z.boolean().optional(),
  })),
});

export const createFlowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  definition: flowDefinitionSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  triggerType: z.string().optional(),
  triggerKeywords: z.any().optional(),
});

export const updateFlowSchema = createFlowSchema.partial(); 