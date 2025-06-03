import { cookies } from "next/headers";
// @ts-ignore
import { jwtVerify } from "jose";
import { db } from "./db";

// Tipo para el usuario autenticado
interface UserSession {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

/**
 * Obtiene el usuario actualmente autenticado
 * @returns Información del usuario autenticado o null si no hay sesión
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    // Obtener token JWT de las cookies
    const cookieStore = cookies();
    // @ts-ignore - El tipado de cookies() ha cambiado en versiones recientes
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // Verificar el token JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    try {
      const { payload } = await jwtVerify(token, secret);

      if (!payload.sub) {
        return null;
      }

      // Obtener el usuario de la base de datos para asegurar que existe
      const user = await db.user.findUnique({
        where: {
          id: payload.sub as string,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || "",
        fullName: user.fullName || undefined,
        avatarUrl: user.avatarUrl || undefined,
      };
    } catch (verifyError) {
      console.error("Error verificando token JWT:", verifyError);
      return null;
    }
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    return null;
  }
}
