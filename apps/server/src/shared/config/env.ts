import { z } from 'zod'

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

export const env: Env = envSchema.parse(process.env)

// Derived helpers
export const isTest = env.NODE_ENV === 'test'
export const isProd = env.NODE_ENV === 'production'
export const isDev = env.NODE_ENV === 'development'
