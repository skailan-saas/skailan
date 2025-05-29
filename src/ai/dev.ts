import { config } from 'dotenv';
config();

import '@/ai/flows/generate-flow-from-prompt.ts';
import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/suggest-response.ts';