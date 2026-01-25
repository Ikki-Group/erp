import { envSchema, type Env } from "./env.schema"

/**
 * Validated environment configuration
 * Throws at startup if required env vars are missing
 */
function loadConfig(): Env {
  const result = envSchema.safeParse(Bun.env)

  if (!result.success) {
    console.error("❌ Invalid environment variables:")
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }

  return result.data
}

export const config = loadConfig()

// Re-export types
export type { Env }
