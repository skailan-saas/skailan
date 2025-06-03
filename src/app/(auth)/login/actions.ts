"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  try {
    // Buscar usuario por email en la tabla User
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user || !user.hashedPassword) {
      return { error: "Credenciales inválidas" };
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

    if (!isValidPassword) {
      return { error: "Credenciales inválidas" };
    }

    // Obtener el tenant del usuario
    const cookiesList = await cookies();
    const tenantId = cookiesList.get("tenant_id")?.value;

    // Encontrar el tenantUser correspondiente
    const tenantUser = user.tenants.find(
      (tu) => (tenantId ? tu.tenantId === tenantId : true) // Si hay tenantId en cookie, usar ese, sino el primero
    );

    if (!tenantUser) {
      return { error: "Usuario no pertenece a este tenant" };
    }

    // Crear JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tenantId: tenantUser.tenantId,
        role: tenantUser.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Establecer cookies
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    // Asegurar que tenant_id también esté establecido
    cookieStore.set("tenant_id", tenantUser.tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    // Determinar la URL de redirección correcta
    const tenant = tenantUser.tenant;
    let redirectUrl = "/dashboard";

    // Si estamos en localhost sin subdominio y el tenant tiene un subdominio específico
    if (tenant.subdomain && tenant.customDomain) {
      // En desarrollo, redirigir al subdominio correcto
      if (process.env.NODE_ENV === "development") {
        redirectUrl = `http://${tenant.customDomain}:3000/dashboard`;
      } else {
        redirectUrl = `https://${tenant.customDomain}/dashboard`;
      }
    }

    return {
      success: true,
      redirectTo: redirectUrl,
      userName: user.fullName || user.email,
      tenantName: tenantUser.tenant.name,
      tenantSubdomain: tenant.subdomain,
    };
  } catch (error) {
    console.error("Error en login:", error);
    return { error: "Error interno del servidor" };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");
    cookieStore.delete("tenant_id");
    return { success: true };
  } catch (error) {
    console.error("Error en logout:", error);
    return { error: "Error al cerrar sesión" };
  }
}
