import { z } from "zod";

/**
 * Environment configuration (see .env.example).
 *
 * Design choice: this loader is *tolerant* — service credentials are optional so
 * the app can boot and render the marketing site before keys are added. Code that
 * actually needs a credential calls `requireEnv()` and fails with a clear message
 * at the point of use, never silently. Required-everywhere values have safe defaults.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Core (have dev defaults)
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().default("localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),

  // Auth
  AUTH_SECRET: z.string().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // Mongo
  MONGODB_URI: z.string().optional(),
  MONGODB_DB: z.string().default("shubalekha"),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Shubalekha <onboarding@resend.dev>"),

  // Storage
  STORAGE_PROVIDER: z.enum(["r2", "s3"]).default("r2"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCOUNT_ID: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_REGION: z.string().default("auto"),
  NEXT_PUBLIC_STORAGE_PUBLIC_URL: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().optional(),

  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Only thrown for *malformed* values (e.g. bad enum), never missing-but-optional.
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. See .env.example.");
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";

/** Apex domain without protocol/port, e.g. "shubalekha.com" or "localhost". */
export const ROOT_DOMAIN = env.NEXT_PUBLIC_ROOT_DOMAIN.replace(/:\d+$/, "");

/**
 * Fetch a required env var or throw a clear, actionable error at the point of use.
 * Use in service code (db, redis, storage, email) so a missing key surfaces where
 * it matters instead of blocking the whole app from booting.
 */
export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${String(key)}. Add it to .env.local (see .env.example).`,
    );
  }
  return value as NonNullable<(typeof env)[K]>;
}
