import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'

import { logger } from '@/lib/logger'

import { relations } from './schema'

const client = new SQL(process.env.DATABASE_URL!)
export const db = drizzle({ client, relations })

export async function closeDatabase() {
  logger.info('Closing database connections')
  await client.end()
  logger.info('Database connections closed')
}

export type DBTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
