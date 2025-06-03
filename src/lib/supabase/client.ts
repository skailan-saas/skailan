// Este archivo ha sido deshabilitado - el proyecto ahora usa autenticación JWT
// import { createBrowserClient } from '@supabase/ssr';

// export const supabase = createBrowserClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// Exportar un objeto vacío para evitar errores de importación
export const supabase = {
  auth: {
    signUp: () =>
      Promise.resolve({ error: new Error("Supabase deshabilitado") }),
    signIn: () =>
      Promise.resolve({ error: new Error("Supabase deshabilitado") }),
  },
};
