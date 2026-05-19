import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'

import { env } from '@/config/env'

import * as schema from './schema'
import { relations } from './schema/_relations'

const client = new SQL(env.DATABASE_URL)
export const db = drizzle({ client, schema: { ...schema, relations } })
