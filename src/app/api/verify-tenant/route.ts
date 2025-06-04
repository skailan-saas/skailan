import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { subdomain, customDomain } = await request.json();
  if (!subdomain && !customDomain) {
    return NextResponse.json({ available: false, reason: "Faltan parámetros" }, { status: 400 });
  }

  // Verificar unicidad de subdominio
  if (subdomain) {
    const exists = await prisma.tenant.findUnique({ where: { subdomain: subdomain.toLowerCase() } });
    if (exists) {
      return NextResponse.json({ available: false, reason: "El subdominio ya está en uso" }, { status: 409 });
    }
  }

  // Verificar unicidad de customDomain
  if (customDomain) {
    const exists = await prisma.tenant.findUnique({ where: { customDomain } });
    if (exists) {
      return NextResponse.json({ available: false, reason: "El dominio personalizado ya está en uso" }, { status: 409 });
    }
  }

  return NextResponse.json({ available: true });
} 