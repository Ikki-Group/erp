import type { DbClient } from '@/core/database'

import { rolesTable } from '@/db/schema/iam'

type RoleInsert = typeof rolesTable.$inferInsert

/** Default actor ID for test factories (simulates system user) */
const TEST_ACTOR_ID = 1

export const RoleFactory = {
	/**
	 * Build role data without inserting to DB.
	 */
	build: (override?: Partial<RoleInsert>): RoleInsert => ({
		code: `ROLE-${Date.now()}`,
		name: `Test Role ${Date.now()}`,
		description: 'Test role description',
		permissions: [],
		isSystem: false,
		createdBy: TEST_ACTOR_ID,
		updatedBy: TEST_ACTOR_ID,
		...override,
	}),

	/**
	 * Create role in database and return it.
	 */
	create: async (db: DbClient, override?: Partial<RoleInsert>) => {
		const data = RoleFactory.build(override)
		const [role] = await db.insert(rolesTable).values(data).returning()
		return role
	},

	/**
	 * Create multiple roles in database.
	 */
	createList: async (db: DbClient, count: number, override?: Partial<RoleInsert>) => {
		const items = Array.from({ length: count }, () => RoleFactory.build(override))
		return db.insert(rolesTable).values(items).returning()
	},
}
