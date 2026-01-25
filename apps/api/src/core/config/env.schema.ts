import { z } from "zod"

/**
 * Environment variable schema with validation
 * All required env vars must be defined here
 */
export const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),

  // Database
  DATABASE_URL: z.url().describe("PostgreSQL connection string"),

  // Auth
  JWT_SECRET: z.string().min(32).describe("JWT signing secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Observability
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().default("ikki"),

  // App
  APP_NAME: z.string().default("ikki-erp"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
})

export type Env = z.infer<typeof envSchema>
