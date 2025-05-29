// src/ai/flows/suggest-response.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant responses to agent based on customer message and history.
 *
 * - suggestResponse - A function that suggests a response based on the conversation history and current message.
 * - SuggestResponseInput - The input type for the suggestResponse function.
 * - SuggestResponseOutput - The return type for the suggestResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResponseInputSchema = z.object({
  customerMessage: z.string().describe('The latest message from the customer.'),
  conversationHistory: z
    .string()
    .describe('The past conversation history between the agent and customer.'),
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

const SuggestResponseOutputSchema = z.object({
  suggestedResponse: z
    .string()
    .describe('The suggested response for the agent to send to the customer.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  return suggestResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponseInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `You are an AI assistant helping agents respond to customers.

  Given the following conversation history and the customer's latest message, suggest a relevant response for the agent to send.

  Conversation History:
  {{conversationHistory}}

  Customer Message:
  {{customerMessage}}

  Suggested Response:`,
});

const suggestResponseFlow = ai.defineFlow(
  {
    name: 'suggestResponseFlow',
    inputSchema: SuggestResponseInputSchema,
    outputSchema: SuggestResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
