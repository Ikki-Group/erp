import { gt, isNull, ne } from 'drizzle-orm'

import { sessions } from '@/db/schema/iam.ts'

import { and, desc, eq, takeFirst } from '@/infra/database/index.ts'
import type { DbContext, Tx } from '@/infra/database/index.ts'

// ─── Types ───

type SessionInsert = typeof sessions.$inferInsert
export type SessionRow = typeof sessions.$inferSelect

export interface SessionRef {
	id: string
}

// ─── Interface ───

/**
 * Data access for the `sessions` table — the source of truth for session
 * management (list/revoke). Per-request validation is cache-first via
 * `SessionStore`; this repo backs the cache miss fallback and the
 * device-management endpoints.
 */
export interface ISessionRepo {
	readonly db: DbContext
	insert(data: SessionInsert, db?: DbContext | Tx): Promise<SessionRef | undefined>
	findById(id: string, db?: DbContext | Tx): Promise<SessionRow | undefined>
	findActiveByUserId(userId: number, db?: DbContext | Tx): Promise<SessionRow[]>
	revoke(id: string, db?: DbContext | Tx): Promise<SessionRef | undefined>
	revokeAllForUser(userId: number, exceptId: string, db?: DbContext | Tx): Promise<string[]>
	touchLastSeen(id: string, db?: DbContext | Tx): Promise<void>
}

// ─── Implementation ───

export class SessionRepo implements ISessionRepo {
	constructor(readonly db: DbContext) {}

	async insert(data: SessionInsert, db: DbContext | Tx = this.db): Promise<SessionRef | undefined> {
		const [result] = await db.insert(sessions).values(data).returning({ id: sessions.id })
		return result
	}

	async findById(id: string, db: DbContext | Tx = this.db): Promise<SessionRow | undefined> {
		return db.select().from(sessions).where(eq(sessions.id, id)).limit(1).then(takeFirst)
	}

	async findActiveByUserId(userId: number, db: DbContext | Tx = this.db): Promise<SessionRow[]> {
		return db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					isNull(sessions.revokedAt),
					gt(sessions.expiresAt, new Date()),
				),
			)
			.orderBy(desc(sessions.lastSeenAt))
	}

	async revoke(id: string, db: DbContext | Tx = this.db): Promise<SessionRef | undefined> {
		const [result] = await db
			.update(sessions)
			.set({ revokedAt: new Date() })
			.where(and(eq(sessions.id, id), isNull(sessions.revokedAt)))
			.returning({ id: sessions.id })
		return result
	}

	async revokeAllForUser(
		userId: number,
		exceptId: string,
		db: DbContext | Tx = this.db,
	): Promise<string[]> {
		const rows = await db
			.update(sessions)
			.set({ revokedAt: new Date() })
			.where(
				and(eq(sessions.userId, userId), isNull(sessions.revokedAt), ne(sessions.id, exceptId)),
			)
			.returning({ id: sessions.id })
		return rows.map((row) => row.id)
	}

	async touchLastSeen(id: string, db: DbContext | Tx = this.db): Promise<void> {
		await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, id))
	}
}
