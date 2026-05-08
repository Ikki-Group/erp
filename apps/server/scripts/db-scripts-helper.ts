import { sql } from 'drizzle-orm'
import { z } from 'zod'

import type { DbClient } from '@/core/database'

import { db } from '@/db'

import { createModules } from '@/modules/_registry'

import { env } from '@/config/env'

const Action = z.enum(['reset', 'seed', 'seed-dev'])
type Action = z.infer<typeof Action>

async function reset(db: DbClient) {
	console.log('🌱 Resetting database...')
	const resetSql = sql`
DROP SCHEMA drizzle CASCADE;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
`
	await db.execute(resetSql)
	console.log('✅ Database reset.')
}

async function seed(db: DbClient) {
	const m = createModules(db)

	console.log('🌱 Starting core database seed...')
	await m.tool.seed.seed()
	console.log('✅ Core seed completed.')
}

async function seedDev(db: DbClient) {
	const m = createModules(db)

	console.log('🌱 Starting core database seed...')
	await m.tool.seed.seed()
	console.log('✅ Core seed completed.')

	console.log('🌱 Starting development mock data seed...')
	await m.tool.seed.seedDev()
	console.log('✅ Development seed completed.')
}

export async function runDbScriptsHelper(db: DbClient, action: Action) {
	switch (action) {
		case 'reset':
			await reset(db)
			break
		case 'seed':
			await seed(db)
			break
		case 'seed-dev':
			await seedDev(db)
			break
		default:
			console.warn('Invalid action')
	}
}

if (import.meta.main) {
	console.log({ env })
	await runDbScriptsHelper(db, Action.parse(process.argv[2]))
}
