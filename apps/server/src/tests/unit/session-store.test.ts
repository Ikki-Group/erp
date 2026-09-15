import { MemorySessionStore } from '@/infra/session/session.memory.ts'

import { describe, expect, test } from 'bun:test'

describe('MemorySessionStore', () => {
	test('stores and retrieves a session without an active location', async () => {
		const store = new MemorySessionStore({ ttlSeconds: 60 })
		const expiresAt = new Date(Date.now() + 30_000)

		await store.create({ id: 'session-1', userId: 7, expiresAt })

		expect(await store.get('session-1')).toEqual({ id: 'session-1', userId: 7, expiresAt })
	})

	test('expires sessions and deletes all sessions for one user', async () => {
		const store = new MemorySessionStore({ ttlSeconds: 60 })
		await store.create({ id: 'expired', userId: 7, expiresAt: new Date(Date.now() - 1) })
		await store.create({ id: 'active-a', userId: 7, expiresAt: new Date(Date.now() + 30_000) })
		await store.create({ id: 'active-b', userId: 7, expiresAt: new Date(Date.now() + 30_000) })
		await store.create({ id: 'other-user', userId: 8, expiresAt: new Date(Date.now() + 30_000) })

		expect(await store.get('expired')).toBeUndefined()
		await store.deleteAllForUser(7)
		expect(await store.get('active-a')).toBeUndefined()
		expect(await store.get('active-b')).toBeUndefined()
		expect(await store.get('other-user')).toBeDefined()
	})
})
