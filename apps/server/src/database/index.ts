import { instrumentDrizzleClient } from '@kubiks/otel-drizzle'
import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'

import { logger } from '@/lib/logger'

import { env } from '@/config/env'

import * as schema from './schema'

const client = new SQL(env.DATABASE_URL)
export const db = drizzle({ client, schema })
instrumentDrizzleClient(db, { dbSystem: 'postgresql' })

export async function closeDatabase() {
  logger.info('Closing database connections')
  await client.end()
  logger.info('Database connections closed')
}

export type Database = typeof db

export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export * as schema from './schema'
