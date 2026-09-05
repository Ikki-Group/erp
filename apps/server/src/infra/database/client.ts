import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'

import * as schema from '@/db/schema/index.ts'
import { env } from '@/shared/config/env.ts'

neonConfig.webSocketConstructor = ws

const pool = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle(pool, { schema })

export type DbContext = Omit<typeof db, '$client'>
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
