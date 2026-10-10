import { isNull } from 'drizzle-orm'

import { sessions, users } from '@/db/schema/iam.ts'

import { and, eq, takeFirst } from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { UserDto } from './user.contract.ts'

type UserInsert = typeof users.$inferInsert
type UserUpdate = Partial<Omit<UserInsert, 'id'>>
type UserRow = typeof users.$inferSelect

/** Maps a raw DB row to the DTO shape (excludes passwordHash). */
function toDto(row: UserRow): UserDto {
	return {
		id: row.id,
		username: row.username,
		email: row.email,
		name: row.name,
		isActive: row.isActive,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

export class UserRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: Db = this.db): Promise<UserDto | undefined> {
		const row = await db.select().from(users).where(eq(users.id, id)).limit(1).then(takeFirst)
		return row ? toDto(row) : undefined
	}

	/** Includes passwordHash — for login only. */
	findCredentials(username: string, db: Db = this.db) {
		return db
			.select({
				id: users.id,
				username: users.username,
				name: users.name,
				email: users.email,
				passwordHash: users.passwordHash,
				isActive: users.isActive,
			})
			.from(users)
			.where(eq(users.username, username))
			.limit(1)
			.then(takeFirst)
	}

	async insert(data: UserInsert, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(users).values(data).returning({ id: users.id })
		return result
	}

	async update(id: number, data: UserUpdate, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(users)
			.set(data)
			.where(eq(users.id, id))
			.returning({ id: users.id })
		return result
	}

	/** Revokes every live session of the user; returns the revoked session ids. */
	async revokeSessions(userId: number, db: Db = this.db): Promise<string[]> {
		const rows = await db
			.update(sessions)
			.set({ revokedAt: new Date() })
			.where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
			.returning({ id: sessions.id })
		return rows.map((row) => row.id)
	}
}
