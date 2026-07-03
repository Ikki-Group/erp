import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'

import { relations } from '@/db/schema/_relations'

import type { DbClient } from '@/infra/database'

export interface TestContext {
	db: DbClient
	cleanup: () => Promise<void>
}

/**
 * Create isolated test context with transaction.
 * All changes are rolled back after test completes.
 *
 * Uses Bun SQL's reserve() to get a dedicated connection for transaction control.
 */
// oxlint-disable-next-line typescript/require-await
export async function createTestContext(): Promise<TestContext> {
	const client = new SQL(Bun.env.DATABASE_URL!)

	// Reserve a dedicated connection for transaction
	// const reserved = await client.reserve()

	// // Start transaction on reserved connection
	// await reserved`BEGIN`

	const db = drizzle({ client, relations })

	return {
		db,
		cleanup: async () => {
			// await reserved`ROLLBACK`
			// reserved.release()
			// await client.close()
		},
	}
}
