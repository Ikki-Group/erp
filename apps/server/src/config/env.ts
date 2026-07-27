import ms from 'ms'
import { z } from 'zod'

const Env = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']),
	COMMIT_SHA: z.string().optional(),

	// App
	APP_NAME: z.string().default('ikki-erp'),
	APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),

	// Server
	PORT: z.coerce.number().default(3001),
	HOST: z.string().default('0.0.0.0'),

	// Log
	LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
	LOG_FORMAT: z.enum(['json', 'pretty']).catch('json'),

	// Database
	DATABASE_URL: z.string().describe('PostgreSQL connection string'),

	// Auth
	JWT_SECRET: z.string().min(32).describe('JWT signing secret'),
	JWT_EXPIRES_IN: z
		.string()
		.default('7d')
		.transform((value) => {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			const milliseconds = ms(value as ms.StringValue)
			if (!milliseconds || milliseconds <= 0) {
				throw new Error(`Invalid JWT_EXPIRES_IN value: "${value}" resolves to ${milliseconds}ms`)
			}
			return Math.floor(milliseconds / 1000) // Convert to seconds for jsonwebtoken
		}),

	// Observability
	AXIOM_URL: z.string().optional(),
	AXIOM_TOKEN: z.string().optional(),
	AXIOM_DATASET: z.string().optional(),

	OTEL_LOGS_ENABLED: z
		.string()
		.default('true')
		.transform((v) => v === 'true'),
	OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),

	// Cache (Redis / Upstash) — L2 distributed cache + cross-instance bus.
	// Standard `redis://` or `rediss://` connection string (Upstash "Redis Connect" tab,
	// NOT the REST URL/token pair — those are for the HTTP API, unusable by ioredis).
	// Optional: when unset, cache runs L1-memory-only (fine for local dev/tests, NOT
	// recommended for production on Fly.io with scale-to-zero — see docs/CACHING.md).
	REDIS_URL: z
		.string()
		.optional()
		.describe('Redis/Upstash connection string (redis:// or rediss://)'),

	// CORS
	CORS_ORIGINS: z
		.string()
		.optional()
		.transform((v) =>
			v
				?.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
		),
})

const _env = Env.safeParse(Bun.env) // eslint-disable-line no-underscore-dangle

if (!_env.success) {
	console.error('Invalid environment variables:', z.treeifyError(_env.error))
	process.exit(1)
}

if (
	_env.data.APP_ENV === 'production' &&
	(!_env.data.CORS_ORIGINS || _env.data.CORS_ORIGINS.length === 0)
) {
	console.error('CORS_ORIGINS must be set in production')
	process.exit(1)
}

export const env = _env.data
