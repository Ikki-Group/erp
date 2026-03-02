import { instrumentDrizzleClient } from '@kubiks/otel-drizzle'
import { Pool } from '@neondatabase/serverless'
// import { upstashCache } from 'drizzle-orm/cache/upstash'
import { drizzle } from 'drizzle-orm/neon-serverless'

import { logger } from '@/lib/logger'

import { env } from '@/config/env'

import * as schema from './schema'
import { relations } from './schema/relations'

// const cache = upstashCache({
//   url: env.UPSTASH_REDIS_REST_URL,
//   token: env.UPSTASH_REDIS_REST_TOKEN,
//   global: true,
//   config: {
//     keepTtl: true,
//     ex: 60 * 60 * 24 * 7,
//   },
// })

// const client = new SQL(env.DATABASE_URL)
const pool = new Pool({ connectionString: env.DATABASE_URL, min: 10, max: 100 })
export const db = drizzle({
  client: pool,
  schema,
  relations,
  // cache,
})
instrumentDrizzleClient(db, { dbSystem: 'postgresql' })

export async function closeDatabase() {
  logger.info('Closing database connections')
  await pool.end()
  logger.info('Database connections closed')
}

export type Database = typeof db
export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export * as schema from './schema'
