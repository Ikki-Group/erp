import { gt, isNull, ne } from 'drizzle-orm'

import { sessions } from '@/db/schema/iam.ts'

import { and, desc, eq, takeFirst } from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'

// ─── Types ───

type SessionInsert = typeof sessions.$inferInsert
export type SessionRow = typeof sessions.$inferSelect

export interface SessionRef {
	id: string
}

// ─── Implementation ───

export class SessionRepo {
	constructor(readonly db: DbContext) {}

	async insert(data: SessionInsert, db: Db = this.db): Promise<SessionRef | undefined> {
		const [result] = await db.insert(sessions).values(data).returning({ id: sessions.id })
		return result
	}

	async findById(id: string, db: Db = this.db): Promise<SessionRow | undefined> {
		return db.select().from(sessions).where(eq(sessions.id, id)).limit(1).then(takeFirst)
	}

	async findActiveByUserId(userId: number, db: Db = this.db): Promise<SessionRow[]> {
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

	async revoke(id: string, db: Db = this.db): Promise<SessionRef | undefined> {
		const [result] = await db
			.update(sessions)
			.set({ revokedAt: new Date() })
			.where(and(eq(sessions.id, id), isNull(sessions.revokedAt)))
			.returning({ id: sessions.id })
		return result
	}

	/** Revokes every live session of a user (optionally keeping one); returns revoked ids. */
	async revokeAllForUser(userId: number, exceptId?: string, db: Db = this.db): Promise<string[]> {
		const rows = await db
			.update(sessions)
			.set({ revokedAt: new Date() })
			.where(
				and(
					eq(sessions.userId, userId),
					isNull(sessions.revokedAt),
					exceptId === undefined ? undefined : ne(sessions.id, exceptId),
				),
			)
			.returning({ id: sessions.id })
		return rows.map((row) => row.id)
	}

	async touchLastSeen(id: string, db: Db = this.db): Promise<void> {
		await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, id))
	}
}
