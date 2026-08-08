import { eq, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

import { sessions } from '@/db/schema/iam.ts'

import { db, takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

// ─── Types ───

export interface SessionData {
	id: string
	userId: number
	locationId: number | null
	expiresAt: Date
}

export interface CreateSessionInput {
	id: string
	userId: number
	locationId?: number | null
	expiresAt: Date
}

// ─── Session Store ───

export const sessionStore = {
	/** Get a valid (non-expired) session by ID. */
	async get(sessionId: string, database: DbContext = db): Promise<SessionData | undefined> {
		return database
			.select()
			.from(sessions)
			.where(and(eq(sessions.id, sessionId), sql`${sessions.expiresAt} > now()`))
			.limit(1)
			.then(takeFirst)
	},

	/** Create a new session record. */
	async create(data: CreateSessionInput, database: DbContext = db): Promise<void> {
		await database.insert(sessions).values({
			id: data.id,
			userId: data.userId,
			locationId: data.locationId ?? null,
			expiresAt: data.expiresAt,
		})
	},

	/** Delete a session (logout). */
	async delete(sessionId: string, database: DbContext = db): Promise<void> {
		await database.delete(sessions).where(eq(sessions.id, sessionId))
	},

	/** Update the active location for a session (context switch). */
	async updateLocation(
		sessionId: string,
		locationId: number,
		database: DbContext = db,
	): Promise<void> {
		await database.update(sessions).set({ locationId }).where(eq(sessions.id, sessionId))
	},

	/** Delete all sessions for a user (force logout everywhere). */
	async deleteAllForUser(userId: number, database: DbContext = db): Promise<void> {
		await database.delete(sessions).where(eq(sessions.userId, userId))
	},
}
