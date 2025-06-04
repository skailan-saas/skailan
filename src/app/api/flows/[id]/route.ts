import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserWithTenant } from "@/lib/session";
import { updateFlowSchema } from "@/lib/schemas/flow-schema";

// Helper para verificar acceso y obtener el flow
async function getFlowIfAuthorized(id: string, userId: string, tenantId: string) {
  const flow = await prisma.chatbotFlow.findUnique({ where: { id } });
  if (!flow || flow.tenantId !== tenantId || flow.deletedAt) return null;
  const isMember = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
  if (!isMember) return null;
  return flow;
}

// GET /api/flows/[id]
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUserWithTenant();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });
  const flow = await getFlowIfAuthorized(params.id, user.id, user.tenantId);
  if (!flow) return NextResponse.json({ error: "No autorizado o no encontrado" }, { status: 404 });
  return NextResponse.json(flow);
}

// PUT /api/flows/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUserWithTenant();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });
  const flow = await getFlowIfAuthorized(params.id, user.id, user.tenantId);
  if (!flow) return NextResponse.json({ error: "No autorizado o no encontrado" }, { status: 404 });
  const body = await request.json();
  const parse = updateFlowSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parse.error.errors }, { status: 400 });
  }
  const updated = await prisma.chatbotFlow.update({
    where: { id: params.id },
    data: parse.data,
  });
  return NextResponse.json(updated);
}

// DELETE /api/flows/[id]
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUserWithTenant();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });
  const flow = await getFlowIfAuthorized(params.id, user.id, user.tenantId);
  if (!flow) return NextResponse.json({ error: "No autorizado o no encontrado" }, { status: 404 });
  await prisma.chatbotFlow.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ success: true });
} 