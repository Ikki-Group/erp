import { db } from '@/db'

import { initModules, type Modules } from '@/modules/_registry'
import { initRoutes } from '@/modules/_routes'

import { TestClient } from './helpers/test-client'
import { createApp } from '@/app'
import { beforeAll } from 'bun:test'
import type { Elysia } from 'elysia'

if (!Bun.env.DATABASE_URL) {
	throw new Error('DATABASE_URL must be set')
}

interface TestContext {
	app: Elysia
	modules: Modules
	client: TestClient
}

export let testCtx: TestContext

/**
 * Global test setup.
 * Clears DB and seeds essential data before all tests.
 * Each test handles its own transaction isolation via createTestContext().
 */
beforeAll(() => {
	const modules = initModules(db)
	const app = createApp(modules)
	initRoutes(modules).register(app)

	testCtx = {
		app,
		modules,
		client: new TestClient(app, 'http://localhost'),
	}
}, 500_000)

// afterAll(async () => {
// 	// Cleanup after all tests complete
// 	console.log('🧹 Final cleanup...')
// 	const client = new SQL(DATABASE_URL)
// 	await client.close()
// })
