/**
 * Auth test helper — login and extract session cookie for authenticated requests.
 */
import { POST } from './request.ts'

/**
 * Login as a seeded user and return the session cookie string.
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

	const cookie = res.headers.get('set-cookie')
	if (!cookie) {
		throw new Error(`loginAs('${username}') succeeded but no set-cookie header returned`)
	}

	return cookie
}
