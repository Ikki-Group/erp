import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'
import { sql } from 'drizzle-orm'

import { relations } from '@/db/schema'

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

let testClient: SQL | null = null
let testDb: ReturnType<typeof drizzle> | null = null
let migrationsRun = false

export function getTestDatabase() {
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

	// Truncate all tables to start fresh
	await resetTestDatabase()
}

export async function resetTestDatabase(): Promise<void> {
	const db = getTestDatabase()

	// Get all table names from the public schema
	const tables = await db.execute(sql`
		SELECT tablename FROM pg_tables 
		WHERE schemaname = 'public' 
		AND tablename NOT LIKE 'pg_%' 
		AND tablename NOT LIKE '_prisma_%'
	`) as { tablename: string }[]

	// Truncate each table
	for (const row of tables) {
		const tableName = row.tablename
		// Skip migration tables
		if (tableName === 'migrations' || tableName.includes('drizzle')) continue

		await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`))
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
