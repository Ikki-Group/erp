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
	PORT: z.coerce.number().default(4001),

	// Database
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
	DB_POOL_MAX: z.coerce.number().int().positive().default(10),

	// CORS — comma-separated origins; required in production ("*" only if set explicitly)
	CORS_ORIGINS: z
		.string()
		.optional()
		.transform((v) =>
			v
				?.split(',')
				.map((o) => o.trim())
				.filter(Boolean),
		),

	// Auth rate limiting (fixed window per client IP + username)
	AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
	AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
	/** Defaults to enabled outside NODE_ENV=test. */
	AUTH_RATE_LIMIT_ENABLED: z.stringbool().optional(),

	// Redis (optional — session store and BentoCache L2 layer; memory-only when unset)
	REDIS_URL: z.string().optional(),

	// Axiom / OTel (optional — no traces exported if missing)
	AXIOM_URL: z.url().optional(),
	AXIOM_TOKEN: z.string().optional(),
	AXIOM_DATASET: z.string().optional(),
})

const DEV_CORS_ORIGINS = ['http://localhost:4002']

const resolvedEnvSchema = envSchema.transform((e, ctx) => {
	if (e.CORS_ORIGINS?.length) return { ...e, CORS_ORIGINS: e.CORS_ORIGINS }
	if (e.NODE_ENV === 'production') {
		ctx.addIssue({
			code: 'custom',
			path: ['CORS_ORIGINS'],
			message: 'CORS_ORIGINS is required in production',
		})
		return z.NEVER
	}
	return { ...e, CORS_ORIGINS: DEV_CORS_ORIGINS }
})

export type Env = z.infer<typeof resolvedEnvSchema>

export const env: Env = resolvedEnvSchema.parse(Bun.env)

// Derived helpers
export const isTest = env.NODE_ENV === 'test'
export const isProd = env.NODE_ENV === 'production'
