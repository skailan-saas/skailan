// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Ensure these environment variables are defined in your .env file.
// NEXT_PUBLIC_ variables are also accessible on the server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL (server-side)");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY (server-side)");
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookieStore.set method is async, you'll need to await it
          // and make this function async. Based on Next.js examples, it's usually sync.
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error, e.g., if called too early or in an unsupported context
            console.error('Failed to set cookie for Supabase:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options }); // Per Supabase SSR docs for Next.js
          } catch (error) {
             console.error('Failed to remove cookie for Supabase:', error);
          }
        },
      },
    }
  );
}
