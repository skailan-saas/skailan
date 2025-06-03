import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
}

export async function getTenantByDomain(
  domain: string
): Promise<Tenant | null> {
  return prisma.tenant.findFirst({
    where: {
      OR: [{ customDomain: domain }, { subdomain: domain }],
    },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
    },
  });
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant_id")?.value;

    if (!tenantId) {
      console.warn("No tenant_id found in cookies, trying fallback...");

      // Fallback: intentar obtener el tenant desde headers o dominio
      try {
        // En desarrollo, usar el tenant demo por defecto
        if (process.env.NODE_ENV === "development") {
          const fallbackTenant = await prisma.tenant.findFirst({
            where: {
              OR: [{ subdomain: "demo" }, { customDomain: "demo.localhost" }],
            },
            select: {
              id: true,
              name: true,
              subdomain: true,
              customDomain: true,
            },
          });

          if (fallbackTenant) {
            console.log(`Using fallback tenant: ${fallbackTenant.name}`);
            return fallbackTenant;
          }
        }
      } catch (fallbackError) {
        console.error("Fallback tenant lookup failed:", fallbackError);
      }

      return null;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
      },
    });

    if (!tenant) {
      console.warn(`Tenant with ID ${tenantId} not found`);
      return null;
    }

    return tenant;
  } catch (error) {
    console.error("Error getting current tenant:", error);
    return null;
  }
}

export async function getTenantId(): Promise<string | null> {
  const tenant = await getCurrentTenant();
  return tenant?.id || null;
}
