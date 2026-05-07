import { db } from '@/db'

import { initModules, type Modules } from '@/modules/_registry'
import { initRoutes } from '@/modules/_routes'

import { TestClient } from './helpers/test-client'
import { TokenStore } from './helpers/token-store'
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
	tokens: TokenStore
}

export let testCtx: TestContext

/**
 * Global test setup.
 * Initializes app, routes, and test client once before all tests.
 */
beforeAll(() => {
	const modules = initModules(db)
	const app = createApp(modules)
	initRoutes(modules).register(app)

	const tokens = new TokenStore()

	testCtx = {
		app,
		modules,
		tokens,
		client: new TestClient(app, 'http://localhost', {}, tokens),
	}
})

// afterAll(async () => {
// 	// Cleanup after all tests complete
// 	console.log('🧹 Final cleanup...')
// 	const client = new SQL(DATABASE_URL)
// 	await client.close()
// })
