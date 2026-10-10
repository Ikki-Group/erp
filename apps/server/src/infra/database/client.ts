import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '@/db/schema/index.ts'

import { env } from '@/shared/config/env.ts'

// `prepare: false` keeps it compatible with transaction-mode poolers (Neon `-pooler` URLs).
const client = postgres(env.DATABASE_URL, { max: 10, prepare: false, onnotice: () => {} })

export const db = drizzle(client, { schema })
export type DbContext = Omit<typeof db, '$client'>
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
