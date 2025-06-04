import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

export async function getCurrentTenantId(): Promise<string | null> {
  const supabase = createClient(cookies());
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const userId = data.user.id;
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId },
  });
  return tenantUser?.tenantId || null;
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return null;
  return {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    customDomain: tenant.customDomain,
  };
}

export async function getTenantId(): Promise<string | null> {
  const tenant = await getCurrentTenant();
  return tenant?.id || null;
}
