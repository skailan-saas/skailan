"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getFullDomain } from "@/lib/domain";

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const tenantName = formData.get("tenantName") as string;
  const subdomain = formData.get("subdomain") as string;

  if (!email || !password || !tenantName || !subdomain) {
    return { error: "Todos los campos son requeridos" };
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Formato de email inválido" };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
    return {
      error:
        "El subdominio solo puede contener letras minúsculas, números y guiones",
    };
  }

  const supabase = createClient(await cookies());
  // Crear usuario en Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { fullName: email.split("@")[0] },
    },
  });

  if (error || !data.user) {
    return { error: error?.message || "No se pudo crear el usuario" };
  }

  // Crear tenant en la base de datos
  const userId = data.user.id;
  const fullDomain = getFullDomain(subdomain);
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        subdomain: subdomain.toLowerCase(),
        customDomain: fullDomain,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
    });
    return {
      success: true,
      redirectTo: "/dashboard",
      userName: data.user.user_metadata?.fullName || data.user.email,
      tenantName: tenant.name,
      message: "Cuenta creada exitosamente",
    };
  } catch (e: any) {
    console.error("[ERROR][signupAction] Error al crear el tenant:", e);
    if (e.code === "P2002") {
      // Violación de unicidad
      return { error: "El subdominio o dominio ya está en uso." };
    }
    if (e.code === "P2003") {
      // Violación de clave foránea
      return { error: "El usuario no existe o hay un problema de integridad." };
    }
    return { error: e.message || "Error al crear el tenant" };
  }
}
