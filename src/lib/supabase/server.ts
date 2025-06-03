// Este archivo ha sido deshabilitado - el proyecto ahora usa autenticación JWT
// import { createServerClient, type CookieOptions } from "@supabase/ssr";
// import { cookies } from "next/headers";

// Exportar funciones vacías para evitar errores de importación
export function createClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}

export const supabase = createClient();
