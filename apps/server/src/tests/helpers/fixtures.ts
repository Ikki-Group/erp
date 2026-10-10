/**
 * Small write fixtures for integration tests (run as a user allowed to create them).
 */
import { POST, json } from './request.ts'

/** POST and return `data.id`; throws with the body when the request fails. */
export async function createId(path: string, token: string, body: unknown): Promise<number> {
	const res = await POST(path, { token, body })
	if (res.status !== 200) throw new Error(`${path} failed (${res.status}): ${await res.text()}`)
	return (await json<{ data: { id: number } }>(res)).data.id
}

/** A fresh active location with a unique code. */
export function createLocation(token: string, type: 'store' | 'warehouse'): Promise<number> {
	const suffix = crypto.randomUUID().slice(0, 8)
	return createId('/location/create', token, {
		code: `TEST-${suffix}`,
		name: `Test Location ${suffix}`,
		type,
		address: 'Test address',
		phone: null,
		isActive: true,
	})
}
