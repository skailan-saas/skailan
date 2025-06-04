"use server";

import { supabase } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  // Login con Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || "Credenciales inválidas" };
  }

  // Buscar el tenant principal del usuario
  const userId = data.user.id;
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId },
    include: { tenant: true },
  });

  if (!tenantUser) {
    return { error: "Usuario no pertenece a ningún tenant" };
  }

  // Redirección según tenant
  const tenant = tenantUser.tenant;
  let redirectUrl = "/dashboard";
  if (tenant.subdomain && tenant.customDomain) {
    if (process.env.NODE_ENV === "development") {
      redirectUrl = `http://${tenant.customDomain}:3000/dashboard`;
    } else {
      redirectUrl = `https://${tenant.customDomain}/dashboard`;
    }
  }

  return {
    success: true,
    redirectTo: redirectUrl,
    userName: data.user.user_metadata?.fullName || data.user.email,
    tenantName: tenant.name,
    tenantSubdomain: tenant.subdomain,
  };
}

export async function logoutAction() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
