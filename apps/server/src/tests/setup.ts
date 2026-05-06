import { SQL, $ } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'

import { relations } from '@/db/schema'

import { initModules } from '@/modules/_registry'
import { initRoutes } from '@/modules/_routes'

import { runDbScriptsHelper } from '../../scripts/db-scripts-helper'
import { createApp } from '@/app'
import { beforeAll, afterAll } from 'bun:test'

const client = new SQL(Bun.env.TEST_DATABASE_URL!)
const db = drizzle({ client, relations })

const modules = initModules(db)
const routes = initRoutes(modules)

const app = createApp(modules)
routes.register(app)

beforeAll(async () => {
	console.log(`=== Setup test ===`)

	if (!Bun.env.TEST_DATABASE_URL) {
		throw new Error('TEST_DATABASE_URL must be set')
	}

	await runDbScriptsHelper(db, 'reset').catch(() => {
		// ignore
	})

	await $`bun run db:migrate`
	await runDbScriptsHelper(db, 'seed-dev')
})

afterAll(async () => {
	console.log('Teardown test')
})
