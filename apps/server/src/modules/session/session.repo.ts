import { eq, lte } from 'drizzle-orm'

import { sessionsTable } from '@/db/schema'

import { takeFirst, type DbContext } from '@/infra/database'

import type { SessionDto } from './session.contract'

/**
 * Repository port for the session module. Services depend on this interface
 * (not the concrete class) so they can be unit-tested with plain in-memory
 * fakes and no database. Not-found reads return `undefined` — repos never
 * throw for "not found", the service decides error semantics.
 */
export interface ISessionRepo {
	/** The default database context this repo is bound to (client or tx). */
	readonly db: DbContext
	getById(id: number): Promise<SessionDto | undefined>
	getByUserId(userId: number): Promise<SessionDto[]>
	create(data: typeof sessionsTable.$inferInsert): Promise<SessionDto>
	invalidate(id: number): Promise<void>
	invalidateByUserId(userId: number): Promise<void>
	cleanupExpired(): Promise<number>
}

export class SessionRepo implements ISessionRepo {
	constructor(readonly db: DbContext) {}

	async getById(id: number): Promise<SessionDto | undefined> {
		const result = await this.db.select().from(sessionsTable).where(eq(sessionsTable.id, id))
		return takeFirst(result) ?? undefined
	}

	async getByUserId(userId: number): Promise<SessionDto[]> {
		const result = await this.db
			.select()
			.from(sessionsTable)
			.where(eq(sessionsTable.userId, userId))
			.orderBy(sessionsTable.createdAt)
		return result
	}

	async create(data: typeof sessionsTable.$inferInsert): Promise<SessionDto> {
		const [session] = await this.db.insert(sessionsTable).values(data).returning()

		if (!session) throw new Error('Failed to create session')
		return session as SessionDto
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
