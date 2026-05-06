import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'

import { relations } from './schema'
import { env } from '@/config/env'

const client = new SQL(env.DATABASE_URL)
export const db = drizzle({ client, relations })

export function initDb(url: string) {
	const client = new SQL(url)
	return drizzle({ client, relations })
}

export type ReturnDbClient = typeof db
