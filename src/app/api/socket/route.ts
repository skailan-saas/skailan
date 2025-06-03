import { NextRequest, NextResponse } from "next/server";

// Simple endpoint para confirmar que está disponible
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Socket endpoint disponible",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    message: "Socket endpoint disponible",
    timestamp: new Date().toISOString(),
  });
}
