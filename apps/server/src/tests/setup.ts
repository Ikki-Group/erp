import { $ } from 'bun'

import { initDb } from '@/db'

import { initModules } from '@/modules/_registry'
import { initRoutes } from '@/modules/_routes'

import { runDbScriptsHelper } from '../../scripts/db-scripts-helper'
import { createApp } from '@/app'
import { beforeAll } from 'bun:test'

if (!Bun.env.DATABASE_URL) {
	throw new Error('DATABASE_URL must be set')
}

const db = initDb(Bun.env.DATABASE_URL)

console.log(Bun.env.NODE_ENV)

beforeAll(async () => {
	console.log(`=== Setup test ===`)
	console.log(Bun.env.NODE_ENV)

	await runDbScriptsHelper(db, 'reset').catch(() => {
		// ignore
	})

	console.log('🌱 Running migrations...')

	await $`bun run db:migrate`

	console.log('✅ Migrations completed.')

	// Create fresh client and db after migrations
	const m = initModules(db)
	const routes = initRoutes(m)

	const app = createApp(m)
	routes.register(app)

	console.log('🌱 Running seed...')
	await runDbScriptsHelper(db, 'seed-dev')
	console.log('✅ Seed completed.')
}, 60000)

// afterAll(async () => {
// 	console.log('Teardown test')
// 	// await client?.close()
// })
