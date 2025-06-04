import { NextResponse } from "next/server";
import { getTenantByDomain } from "@/lib/tenant";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const userId = searchParams.get("user_id");

  // Log temporal para depuración
  console.log("[API/tenant] domain:", domain, "user_id:", userId);

  if (userId) {
    try {
      // Buscar el tenant asociado al usuario
      const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId },
        include: { tenant: true },
      });
      console.log("[API/tenant] tenantUser:", tenantUser);
      if (!tenantUser || !tenantUser.tenant) {
        return NextResponse.json({ error: "Tenant not found for user" }, { status: 404 });
      }
      // Devolver solo los datos relevantes
      return NextResponse.json({
        id: tenantUser.tenant.id,
        name: tenantUser.tenant.name,
        subdomain: tenantUser.tenant.subdomain,
        customDomain: tenantUser.tenant.customDomain,
      });
    } catch (error) {
      console.error("Error fetching tenant by user_id in API route:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  if (!domain) {
    return NextResponse.json(
      { error: "Domain parameter is missing" },
      { status: 400 }
    );
  }

  try {
    const tenant = await getTenantByDomain(domain);
    console.log("[API/tenant] tenant by domain:", tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant in API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
