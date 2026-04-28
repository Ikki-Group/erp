import { SQL } from 'bun'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sql'

import type { DbClient } from '@/core/database/types'

import { relations } from '@/db/schema'

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL

let testClient: SQL | null = null
let testDb: DbClient | null = null
let migrationsRun = false

export function getTestDatabase(): DbClient {
	if (!testDb) {
		if (!TEST_DATABASE_URL) {
			throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set')
		}
		testClient = new SQL(TEST_DATABASE_URL)
		testDb = drizzle({ client: testClient, relations })
	}
	return testDb
}

export async function setupTestDatabase(): Promise<void> {
	// Run migrations first (only once)
	if (!migrationsRun) {
		await runMigrations()
		migrationsRun = true
	}
}

/**
 * Wraps a test function in a transaction that rolls back on completion.
 * This is faster than truncating tables and provides better isolation.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
	const db = getTestDatabase()
	await db.execute(sql`BEGIN`)
	try {
		const result = await fn()
		await db.execute(sql`ROLLBACK`)
		return result
	} catch (error) {
		await db.execute(sql`ROLLBACK`)
		throw error
	}
}

export async function teardownTestDatabase(): Promise<void> {
	if (testClient) {
		await testClient.close()
		testClient = null
		testDb = null
	}
}

export async function runMigrations(): Promise<void> {
	const db = getTestDatabase()

	// Check if migrations table exists
	try {
		await db.execute(sql`SELECT 1 FROM drizzle.__drizzle_migrations LIMIT 1`)
	} catch {
		// Migrations table doesn't exist, create it
		await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`)
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
				id SERIAL PRIMARY KEY,
				hash TEXT NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)
	}

	// Run migrations via drizzle-kit (requires CLI execution)
	// In CI/test environment, migrations should be run before tests start
	// via: bunx drizzle-kit migrate
}
