import { z } from "zod";

export const reactFlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "input",
    "output",
    "text",
    "image",
    "buttons",
    "carousel",
    "userInput",
    "condition",
    "action",
  ]),
  data: z.record(z.any()),
  position: z.object({ x: z.number(), y: z.number() }),
});

export const reactFlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
});

export const reactFlowConfigSchema = z.object({
  nodes: z.array(reactFlowNodeSchema).min(1),
  edges: z.array(reactFlowEdgeSchema),
});

export function validateReactFlowConfig(jsonString: string): { valid: boolean; error?: string; parsed?: any } {
  try {
    const parsed = JSON.parse(jsonString);
    const result = reactFlowConfigSchema.safeParse(parsed);
    if (!result.success) {
      return { valid: false, error: result.error.message };
    }
    return { valid: true, parsed: result.data };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
} 