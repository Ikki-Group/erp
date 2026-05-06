import type { DbClient } from '@/core/database'

import { usersTable, userAssignmentsTable } from '@/db/schema/iam'

type UserInsert = typeof usersTable.$inferInsert

/** Default actor ID for test factories (simulates system user) */
const TEST_ACTOR_ID = 1

/** Default password for test users */
const DEFAULT_PASSWORD = 'password123'

export const UserFactory = {
	/**
	 * Build user data without inserting to DB.
	 */
	build: async (override?: Partial<UserInsert>): Promise<UserInsert> => ({
		email: `user-${Date.now()}@test.com`,
		username: `user${Date.now()}`,
		fullname: 'Test User',
		passwordHash: await Bun.password.hash(DEFAULT_PASSWORD),
		pinCode: null,
		isRoot: false,
		isSystem: false,
		isActive: true,
		createdBy: TEST_ACTOR_ID,
		updatedBy: TEST_ACTOR_ID,
		...override,
	}),

	/**
	 * Create user in database and return it.
	 */
	create: async (db: DbClient, override?: Partial<UserInsert>) => {
		const data = await UserFactory.build(override)
		const [user] = await db.insert(usersTable).values(data).returning()
		return user
	},

	/**
	 * Create user with role assignment at a location.
	 */
	createWithAssignment: async (
		db: DbClient,
		opts: {
			roleId: number
			locationId: number
			override?: Partial<UserInsert>
		},
	) => {
		const user = await UserFactory.create(db, opts.override)

		await db.insert(userAssignmentsTable).values({
			userId: user!.id,
			roleId: opts.roleId,
			locationId: opts.locationId,
			addedBy: null,
		})

		return user
	},

	/**
	 * Create multiple users in database.
	 */
	createList: async (db: DbClient, count: number, override?: Partial<UserInsert>) => {
		const items = await Promise.all(
			Array.from({ length: count }, async (_, i) =>
				UserFactory.build({
					...override,
					email: `user-${Date.now()}-${i}@test.com`,
					username: `user${Date.now()}-${i}`,
				}),
			),
		)
		return db.insert(usersTable).values(items).returning()
	},
}
