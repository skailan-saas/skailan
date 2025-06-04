import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// Tipo para el usuario autenticado
export interface UserSession {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  tenantId?: string;
  tenantName?: string;
}

/**
 * Obtiene el usuario actualmente autenticado desde Supabase
 * @returns Información del usuario autenticado o null si no hay sesión
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const supabase = createClient(cookies());
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email || "",
    fullName: data.user.user_metadata?.fullName || undefined,
    avatarUrl: data.user.user_metadata?.avatarUrl || undefined,
  };
}

export async function getCurrentUserWithTenant(): Promise<UserSession | null> {
  const supabase = createClient(cookies());
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const userId = data.user.id;
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId },
    include: { tenant: true },
  });
  if (!tenantUser) return null;
  return {
    id: data.user.id,
    email: data.user.email || "",
    fullName: data.user.user_metadata?.fullName || undefined,
    avatarUrl: data.user.user_metadata?.avatarUrl || undefined,
    tenantId: tenantUser.tenantId,
    tenantName: tenantUser.tenant.name,
  };
}
