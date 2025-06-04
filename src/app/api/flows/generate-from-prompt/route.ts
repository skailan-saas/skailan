import { NextResponse } from "next/server";
import { generateFlowFromPrompt } from "@/ai/flows/generate-flow-from-prompt";

export async function POST(req: Request) {
  try {
    const { flowDescription } = await req.json();
    const result = await generateFlowFromPrompt({ flowDescription });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 