import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// cookieStore es el objeto retornado por cookies()
export const createClient = (cookieStore: ReadonlyRequestCookies) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          // No-op en server components, Next.js maneja cookies en responses
        },
        remove(name, options) {
          // No-op en server components
        },
      },
    }
  );
};
