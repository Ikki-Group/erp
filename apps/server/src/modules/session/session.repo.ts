import { eq, lte } from 'drizzle-orm'

import { takeFirst, type DbClient } from '@/core/database'

import { sessionsTable } from '@/db/schema'

import type { SessionSchema } from './session.schema'

export class SessionRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SessionSchema | undefined> {
		const result = await this.db.select().from(sessionsTable).where(eq(sessionsTable.id, id))
		return takeFirst(result) ?? undefined
	}

	async getByUserId(userId: number): Promise<SessionSchema[]> {
		const result = await this.db
			.select()
			.from(sessionsTable)
			.where(eq(sessionsTable.userId, userId))
			.orderBy(sessionsTable.createdAt)
		return result
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: typeof sessionsTable.$inferInsert): Promise<SessionSchema> {
		const [session] = await this.db.insert(sessionsTable).values(data).returning()

		if (!session) throw new Error('Failed to create session')
		return session as SessionSchema
	}

	async invalidate(id: number): Promise<void> {
		await this.db
			.update(sessionsTable)
			.set({ expiredAt: new Date() })
			.where(eq(sessionsTable.id, id))
	}

	async invalidateByUserId(userId: number): Promise<void> {
		await this.db
			.update(sessionsTable)
			.set({ expiredAt: new Date() })
			.where(eq(sessionsTable.userId, userId))
	}

	async cleanupExpired(): Promise<number> {
		const result = await this.db
			.delete(sessionsTable)
			.where(lte(sessionsTable.expiredAt, new Date()))
			.returning({ id: sessionsTable.id })

		return result.length
	}
}
