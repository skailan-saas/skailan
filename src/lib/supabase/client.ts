// src/lib/supabase/client.ts
"use client";

import { createBrowserClient } from '@supabase/ssr';

// Ensure these environment variables are defined in your .env file
// and prefixed with NEXT_PUBLIC_ if they are used in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// This instance is safe to use in Browser/Client Components.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
