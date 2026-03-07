import ms from 'ms'
import z from 'zod'

const Env = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.url().describe('PostgreSQL connection string'),

  // Auth
  JWT_SECRET: z.string().min(32).describe('JWT signing secret'),
  JWT_EXPIRES_IN: z
    .string()
    .default('7d')
    .transform((value) => ms(value as ms.StringValue)),

  // Observability
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().default('ikki'),

  // App
  APP_NAME: z.string().default('ikki-erp'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === 'true')
    .default(false),

  // Upstash
  UPSTASH_REDIS_REST_URL: z.url().describe('Upstash Redis REST URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().describe('Upstash Redis REST token'),
})

const _env = Env.safeParse(Bun.env)

if (!_env.success) {
  console.error('Invalid environment variables:', z.treeifyError(_env.error))
  process.exit(1)
}

export const env = _env.data
