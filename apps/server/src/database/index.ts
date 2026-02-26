import { instrumentDrizzleClient } from '@kubiks/otel-drizzle'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

import { logger } from '@/lib/logger'

import { env } from '@/config/env'

import * as schema from './schema'

// const client = new SQL(env.DATABASE_URL)
const pool = new Pool({ connectionString: env.DATABASE_URL })
export const db = drizzle({ client: pool, schema })
instrumentDrizzleClient(db, { dbSystem: 'postgresql' })

export async function closeDatabase() {
  logger.info('Closing database connections')
  await pool.end()
  logger.info('Database connections closed')
}

export type Database = typeof db

export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export * as schema from './schema'
