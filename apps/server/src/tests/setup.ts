import { $ } from 'bun'

import { db } from '@/db'

import { runDbScriptsHelper } from '../../scripts/db-scripts-helper'
import { beforeAll } from 'bun:test'

if (!Bun.env.DATABASE_URL) {
	throw new Error('DATABASE_URL must be set')
}

/**
 * Global test setup.
 * Clears DB and seeds essential data before all tests.
 * Each test handles its own transaction isolation via createTestContext().
 */
beforeAll(async () => {
	console.log('Setup ')
	await runDbScriptsHelper(db, 'reset').catch(() => null)
	await $`bun run db:migrate`.catch(() => null)
	await runDbScriptsHelper(db, 'seed-dev')
	console.log('Setup DOne')
}, 500_000)

// afterAll(async () => {
// 	// Cleanup after all tests complete
// 	console.log('🧹 Final cleanup...')
// 	const client = new SQL(DATABASE_URL)
// 	await client.close()
// })
