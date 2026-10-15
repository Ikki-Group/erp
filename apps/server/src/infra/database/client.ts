import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '@/db/schema/index.ts'

import { env } from '@/shared/config/env.ts'

// Long-lived TCP pool. On Neon, point DATABASE_URL at the pooled (-pooler) endpoint.
export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: env.DB_POOL_MAX,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 10_000,
})

export const db = drizzle(pool, { schema })

export type DbContext = Omit<typeof db, '$client'>
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
