import { envSchema, type Env } from "./env.schema"

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
export type { Env }
