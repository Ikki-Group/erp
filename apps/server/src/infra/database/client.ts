import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '@/db/schema/index.ts'

import { getLogger } from '@/infra/logger/index.ts'
import { env } from '@/shared/config/env.ts'

const logger = getLogger(['database'])

// Long-lived TCP pool. On Neon, point DATABASE_URL at the pooled (-pooler) endpoint.
export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: env.DB_POOL_MAX,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 10_000,
})

// pg emits `error` on the pool when an IDLE client's connection drops (network loss,
// Neon scaling to zero). Without a listener that is an uncaught error and kills the
// process; the pool already discards the client and the next query reconnects.
pool.on('error', (error) => {
	logger.warn('Idle database connection lost', { error: error.message })
})

export const db = drizzle(pool, { schema })

export type DbContext = Omit<typeof db, '$client'>
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
