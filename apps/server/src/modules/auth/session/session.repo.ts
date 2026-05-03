import { record } from '@elysiajs/opentelemetry'
import { eq, lte } from 'drizzle-orm'

import { takeFirst, type DbClient } from '@/core/database'

import { sessionsTable } from '@/db/schema'

import type { SessionDto } from './session.dto'

export class SessionRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SessionDto | undefined> {
		return record('SessionRepo.getById', async () => {
			const result = await this.db.select().from(sessionsTable).where(eq(sessionsTable.id, id))
			return takeFirst(result) ?? undefined
		})
	}

	async getByUserId(userId: number): Promise<SessionDto[]> {
		return record('SessionRepo.getByUserId', async () => {
			const result = await this.db
				.select()
				.from(sessionsTable)
				.where(eq(sessionsTable.userId, userId))
				.orderBy(sessionsTable.createdAt)
			return result
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: typeof sessionsTable.$inferInsert): Promise<SessionDto> {
		return record('SessionRepo.create', async () => {
			const [session] = await this.db.insert(sessionsTable).values(data).returning()

			if (!session) throw new Error('Failed to create session')
			return session as SessionDto
		})
	}

	async invalidate(id: number): Promise<void> {
		return record('SessionRepo.invalidate', async () => {
			await this.db
				.update(sessionsTable)
				.set({ expiredAt: new Date() })
				.where(eq(sessionsTable.id, id))
		})
	}

	async invalidateByUserId(userId: number): Promise<void> {
		return record('SessionRepo.invalidateByUserId', async () => {
			await this.db
				.update(sessionsTable)
				.set({ expiredAt: new Date() })
				.where(eq(sessionsTable.userId, userId))
		})
	}

	async cleanupExpired(): Promise<number> {
		return record('SessionRepo.cleanupExpired', async () => {
			const result = await this.db
				.delete(sessionsTable)
				.where(lte(sessionsTable.expiredAt, new Date()))
				.returning({ id: sessionsTable.id })

			return result.length
		})
	}
}
