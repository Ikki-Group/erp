import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'

import { env } from '@/config/env'

import { relations } from './schema/_relations'

const client = new SQL(env.DATABASE_URL)
export const db = drizzle({ client, relations })
