import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserWithTenant } from "@/lib/session";
import { createFlowSchema } from "@/lib/schemas/flow-schema";

// GET /api/flows
export async function GET() {
  const user = await getCurrentUserWithTenant();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!user.tenantId) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });
  }
  // Verificar que el usuario pertenece al tenant
  const isMember = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: user.tenantId, userId: user.id } },
  });
  if (!isMember) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const flows = await prisma.chatbotFlow.findMany({
    where: { tenantId: user.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(flows);
}

// POST /api/flows
export async function POST(request: Request) {
  const user = await getCurrentUserWithTenant();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!user.tenantId) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });
  }
  // Verificar que el usuario pertenece al tenant
  const isMember = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: user.tenantId, userId: user.id } },
  });
  if (!isMember) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await request.json();
  const parse = createFlowSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parse.error.errors }, { status: 400 });
  }
  const data = parse.data;
  const flow = await prisma.chatbotFlow.create({
    data: { ...data, tenantId: user.tenantId },
  });
  return NextResponse.json(flow, { status: 201 });
} 