import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Importa la instancia singleton de Prisma
import { getFullDomain, getBaseDomain } from "@/lib/domain";

export async function POST(request: Request) {
  const { userId, tenantName, subdomain, userEmail } = await request.json();
  console.log("Received data for tenant creation:", {
    userId,
    tenantName,
    subdomain,
    userEmail,
  });

  if (!userId || !tenantName || !subdomain) {
    console.error("Missing required fields for tenant creation.");
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Generar el dominio completo automáticamente
  const fullDomain = getFullDomain(subdomain);
  const baseDomain = getBaseDomain();

  console.log("Generated domains:", {
    subdomain,
    fullDomain,
    baseDomain,
  });

  try {
    // Primero verificar/crear el usuario en Prisma
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: userEmail || `user-${userId}@temp.com`, // Usar el email proporcionado o un temporal
        hashedPassword: "", // No necesario para autenticación con Supabase
      },
      update: {
        email: userEmail || undefined, // Actualizar email si se proporciona
      },
    });

    console.log("User verified/created in Prisma:", user);

    // Luego crear el tenant asociado
    const newTenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        subdomain: subdomain,
        customDomain: fullDomain, // Usar el dominio completo generado automáticamente
        ownerId: userId, // Asociar el tenant con el ID del usuario de Supabase
        members: {
          create: {
            userId: userId,
            role: "admin", // Asignar rol de administrador al creador
          },
        },
      },
    });

    console.log("Tenant created successfully:", newTenant);
    return NextResponse.json(
      { message: "Tenant created successfully", tenant: newTenant },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating tenant:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      meta: error.meta,
    });

    // Manejar errores específicos de Prisma
    if (error.code === "P2002") {
      const target = error.meta?.target?.join(", ");
      console.error(`Unique constraint violation on field(s): ${target}`);
      return NextResponse.json(
        {
          error: `The ${target} is already in use. Please choose a different value.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create tenant",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
