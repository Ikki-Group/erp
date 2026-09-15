export interface SessionData {
	id: string
	userId: number
	expiresAt: Date
}

export interface CreateSessionInput {
	id: string
	userId: number
	expiresAt: Date
}

/**
 * Session persistence boundary. The application does not know whether sessions
 * live in memory, Redis, or another store.
 */
export interface SessionStore {
	get(sessionId: string): Promise<SessionData | undefined>
	create(data: CreateSessionInput): Promise<void>
	delete(sessionId: string): Promise<void>
	deleteAllForUser(userId: number): Promise<void>
}
