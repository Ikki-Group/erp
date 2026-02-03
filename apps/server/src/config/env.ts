import z from 'zod'

const Env = z.object({
  // Server
  NODE_ENV: z.enum(['dev', 'prod']).default('dev'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.url().describe('PostgreSQL connection string'),

  // Auth
  JWT_SECRET: z.string().min(32).describe('JWT signing secret'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Observability
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().default('ikki'),

  // App
  APP_NAME: z.string().default('ikki-erp'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})

const _env = Env.safeParse(Bun.env)

if (!_env.success) {
  console.error('Invalid environment variables:', z.treeifyError(_env.error))
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

export const env = _env.data
export type Env = z.infer<typeof Env>
