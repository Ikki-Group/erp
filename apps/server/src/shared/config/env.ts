import { z } from 'zod'

import { fileURLToPath } from 'node:url'

// Ensure the server's .env is loaded before validation.
//
// `bun run` autoloads .env from cwd, but tooling that imports this module can
// evaluate it before the environment is populated (e.g. drizzle-kit loading
// drizzle.config.ts), so envSchema.parse() would throw on a missing
// DATABASE_URL. Loading the file here — resolved relative to this module
// rather than cwd — makes env validation deterministic for every consumer
// (server, drizzle-kit, tests) regardless of how the process was launched.
try {
	process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)))
} catch {
	// No .env file present (e.g. production/CI where vars are injected directly).
}

const envSchema = z.object({
	// Core
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	PORT: z.coerce.number().default(3000),

	// Database
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

	// Axiom / OTel (optional — no traces exported if missing)
	AXIOM_URL: z.url().optional(),
	AXIOM_TOKEN: z.string().optional(),
	AXIOM_DATASET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(Bun.env)

// Derived helpers
export const isTest = env.NODE_ENV === 'test'
export const isProd = env.NODE_ENV === 'production'
export const isDev = env.NODE_ENV === 'development'
