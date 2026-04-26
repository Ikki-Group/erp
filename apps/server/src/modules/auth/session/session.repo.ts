import { record } from '@elysiajs/opentelemetry'
import { eq, lte } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { takeFirst } from '@/core/database'

import { db } from '@/db'
import { sessionsTable } from '@/db/schema'

import type { SessionDto } from './session.dto'

const cache = bento.namespace('auth:session')

export class SessionRepo {
	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SessionDto | undefined> {
		return record('SessionRepo.getById', async () =>
			cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const result = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id))
					return takeFirst(result) ?? skip()
				},
			}),
		)
	}

	async getByUserId(userId: number): Promise<SessionDto[]> {
		return record('SessionRepo.getByUserId', async () => {
			const result = await db
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
			const [session] = await db.insert(sessionsTable).values(data).returning()

			if (!session) throw new Error('Failed to create session')
			return session as SessionDto
		})
	}

	async invalidate(id: number): Promise<void> {
		return record('SessionRepo.invalidate', async () => {
			await db.update(sessionsTable).set({ expiredAt: new Date() }).where(eq(sessionsTable.id, id))
		})
	}

	async invalidateByUserId(userId: number): Promise<void> {
		return record('SessionRepo.invalidateByUserId', async () => {
			await db
				.update(sessionsTable)
				.set({ expiredAt: new Date() })
				.where(eq(sessionsTable.userId, userId))
		})
	}

	async cleanupExpired(): Promise<number> {
		return record('SessionRepo.cleanupExpired', async () => {
			const result = await db
				.delete(sessionsTable)
				.where(lte(sessionsTable.expiredAt, new Date()))
				.returning({ id: sessionsTable.id })

			return result.length
		})
	}
}
