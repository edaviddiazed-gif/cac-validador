/**
 * Type-safe environment variables for CAC Validador.
 * Import this module instead of using process.env directly.
 */

import { z } from "zod/v4";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.url(),
  OLLAMA_BASE_URL: z.url().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

/** Validated server-side environment variables (use only in server code). */
export function getServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server env vars:", parsed.error.format());
    throw new Error("Invalid server environment variables");
  }
  return parsed.data;
}

/** Validated client-side environment variables (safe for browser). */
export function getClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error("❌ Invalid client env vars:", parsed.error.format());
    throw new Error("Invalid client environment variables");
  }
  return parsed.data;
}
