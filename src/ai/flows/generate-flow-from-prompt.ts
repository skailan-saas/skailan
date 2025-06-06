/**
 * @fileOverview Flow that generates a chatbot flow configuration from a natural language prompt.
 *
 * - generateFlowFromPrompt - A function that generates a chatbot flow configuration from a natural language prompt.
 * - GenerateFlowFromPromptInput - The input type for the generateFlowFromPrompt function.
 * - GenerateFlowFromPromptOutput - The return type for the generateFlowFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlowFromPromptInputSchema = z.object({
  flowDescription: z
    .string()
    .describe(
      'A natural language description of the desired chatbot flow.'
    ),
});
export type GenerateFlowFromPromptInput = z.infer<typeof GenerateFlowFromPromptInputSchema>;

const GenerateFlowFromPromptOutputSchema = z.object({
  flowConfiguration: z
    .string()
    .describe(
      'A JSON string representing the configuration for the chatbot flow, detailing nodes and transitions.'
    ),
});
export type GenerateFlowFromPromptOutput = z.infer<typeof GenerateFlowFromPromptOutputSchema>;

// Esquema de validación para nodos y edges de React Flow
export const reactFlowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.any()),
  position: z.object({ x: z.number(), y: z.number() }),
});

export const reactFlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  // type, label, animated, etc. son opcionales
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
    return { valid: true, parsed };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

export async function generateFlowFromPrompt(input: GenerateFlowFromPromptInput): Promise<GenerateFlowFromPromptOutput> {
  return generateFlowFromPromptFlow(input);
}

// Prompt actualizado para la IA
const prompt = ai.definePrompt({
  name: 'generateFlowFromPromptPrompt',
  input: {schema: GenerateFlowFromPromptInputSchema},
  output: {schema: GenerateFlowFromPromptOutputSchema},
  prompt: `Eres un experto en diseño de flujos conversacionales para chatbots. Genera un JSON válido para React Flow según la siguiente descripción:

Descripción: {{{flowDescription}}}

El JSON debe tener la siguiente estructura:
{
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "data": { "label": "Inicio" },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "2",
      "type": "text",
      "data": { "label": "Mensaje", "messageText": "¡Hola!" },
      "position": { "x": 0, "y": 100 }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2"
    }
  ]
}
- Cada nodo debe tener un id único, un type, un objeto data y una posición { x, y }.
- Cada edge debe tener un id, un source y un target.
- No incluyas comentarios ni texto adicional, solo el JSON.
- Asegúrate de que haya al menos un nodo y que los nodos estén conectados correctamente.
- Usa tipos de nodo como "input", "output", "text", "image", "buttons", "userInput", "condition", "action", "carousel" según corresponda.
`,
});

export const generateFlowFromPromptFlow = ai.defineFlow(
  {
    name: 'generateFlowFromPromptFlow',
    inputSchema: GenerateFlowFromPromptInputSchema,
    outputSchema: GenerateFlowFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
