import { sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/bun-sql/migrator'
import { z } from 'zod'

import { db } from '@/db'

import { env } from '@/config/env'
import { createCache, type CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { createModules } from '@/modules/_registry'

const Action = z.enum(['reset', 'seed', 'seed-dev', 'all'])
type Action = z.infer<typeof Action>

const isAllowed =
	(env.NODE_ENV === 'test' && env.DATABASE_URL.includes('test-user')) ||
	(env.NODE_ENV === 'development' && env.DATABASE_URL.includes('dev-user'))

async function reset(db: DbContext) {
	console.log('🌱 Resetting database...')
	const resetSql = sql`
DROP SCHEMA drizzle CASCADE;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
`
	await db.execute(resetSql)
	console.log('✅ Database reset.')
}

async function seed(db: DbContext, cacheClient: CacheClient) {
	const m = createModules(db, cacheClient)

	console.log('🌱 Starting core database seed...')
	await m.tool.seed.seed()
	console.log('✅ Core seed completed.')
}

async function runMigrate(db: DbContext) {
	console.log('🌱 Migrating database...')
	await migrate(db, {
		migrationsFolder: './src/db/migrations',
	})
	console.log('✅ Database migrated.')
}

async function seedDev(db: DbContext, cacheClient: CacheClient) {
	const m = createModules(db, cacheClient)

	console.log('🌱 Starting core database seed...')
	await m.tool.seed.seed()
	console.log('✅ Core seed completed.')

	console.log('🌱 Starting development mock data seed...')
	await m.tool.seed.seedDev()
	console.log('✅ Development seed completed.')
}

export async function runDbScriptsHelper(db: DbContext, cacheClient: CacheClient, action: Action) {
	if (!isAllowed) {
		console.warn('Not allowed to run db scripts in this environment')
		throw new Error('Not allowed to run db scripts in this environment')
	}

	switch (action) {
		case 'reset':
			await reset(db)
			break
		case 'seed':
			await seed(db, cacheClient)
			break
		case 'seed-dev':
			await seedDev(db, cacheClient)
			break
		case 'all':
			await reset(db).catch(console.error)
			await runMigrate(db)
			await seedDev(db, cacheClient)
			break
		default:
			console.warn('Invalid action')
	}
}

if (import.meta.main) {
	console.log({ env })
	const cacheClient = createCache()
	await runDbScriptsHelper(db, cacheClient, Action.parse(process.argv[2]))
}
