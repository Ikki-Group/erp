import type { DbClient } from '@/core/database'

import { locationsTable } from '@/db/schema/location'

type LocationInsert = typeof locationsTable.$inferInsert

/** Default actor ID for test factories (simulates system user) */
const TEST_ACTOR_ID = 1

export const LocationFactory = {
	/**
	 * Build location data without inserting to DB.
	 */
	build: (override?: Partial<LocationInsert>): LocationInsert => ({
		code: `LOC-${Date.now()}`,
		name: `Test Location ${Date.now()}`,
		type: 'store',
		description: 'Test location description',
		address: '123 Test Street',
		phone: '+1234567890',
		isActive: true,
		createdBy: TEST_ACTOR_ID,
		updatedBy: TEST_ACTOR_ID,
		...override,
	}),

	/**
	 * Create location in database and return it.
	 */
	create: async (db: DbClient, override?: Partial<LocationInsert>) => {
		const data = LocationFactory.build(override)
		const [location] = await db.insert(locationsTable).values(data).returning()
		return location
	},

	/**
	 * Create multiple locations in database.
	 */
	createList: async (db: DbClient, count: number, override?: Partial<LocationInsert>) => {
		const baseTime = Date.now()
		const items = Array.from({ length: count }, (_, i) =>
			LocationFactory.build({
				...override,
				code: `LOC-${baseTime}-${i}`,
				name: `Test Location ${baseTime}-${i}`,
			}),
		)
		return db.insert(locationsTable).values(items).returning()
	},
}
