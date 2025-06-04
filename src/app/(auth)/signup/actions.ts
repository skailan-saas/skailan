"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getFullDomain } from "@/lib/domain";

const prisma = new PrismaClient();

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

  // Validar contraseña
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  // Validar subdomain
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
    return {
      error:
        "El subdominio solo puede contener letras minúsculas, números y guiones",
    };
  }

  try {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return { error: "Ya existe un usuario con este email" };
    }

    // Verificar si el subdomain ya existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
    });

    if (existingTenant) {
      return { error: "Este subdominio ya está en uso" };
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario y tenant en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          hashedPassword: hashedPassword,
          fullName: email.split("@")[0], // Usar parte del email como nombre inicial
        },
      });

      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          subdomain: subdomain.toLowerCase(),
          customDomain: getFullDomain(subdomain),
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "admin",
            },
          },
        },
      });

      return { user, tenant };
    });

    // Crear JWT token
    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        tenantId: result.tenant.id,
        role: "admin",
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
      domain: process.env.NODE_ENV === "production" ? ".skailan.com" : "localhost",
    });

    cookieStore.set("tenant_id", result.tenant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      domain: process.env.NODE_ENV === "production" ? ".skailan.com" : "localhost",
    });

    return {
      success: true,
      redirectTo: "/dashboard",
      userName: result.user.fullName || result.user.email,
      tenantName: result.tenant.name,
      message: "Cuenta creada exitosamente",
    };
  } catch (error: any) {
    console.error("Error en signup:", error);

    // Manejar errores específicos de Prisma
    if (error.code === "P2002") {
      const target = error.meta?.target?.join(", ");
      if (target?.includes("email")) {
        return { error: "Ya existe un usuario con este email" };
      }
      if (target?.includes("subdomain")) {
        return { error: "Este subdominio ya está en uso" };
      }
      return { error: `El ${target} ya está en uso` };
    }

    return { error: "Error interno del servidor" };
  }
}
