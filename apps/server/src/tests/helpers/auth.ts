/**
 * Auth test helper — login and extract bearer token for authenticated requests.
 */
import { POST, json } from './request.ts'

/**
 * Login as a seeded user and return the bearer token.
 * Throws if login fails (test setup issue).
 */
export async function loginAs(username: string, password = 'password123'): Promise<string> {
	const res = await POST('/auth/login', {
		body: { username, password },
	})

	if (res.status !== 200) {
		const body = await res.text()
		throw new Error(`loginAs('${username}') failed with status ${res.status}: ${body}`)
	}

	const body = await json<{ data?: { token?: unknown } }>(res)
	const token = body.data?.token
	if (typeof token !== 'string' || !token) {
		throw new Error(`loginAs('${username}') succeeded but no token in response body`)
	}

	return token
}
