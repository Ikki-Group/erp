import { loginAs } from '../helpers/auth.ts'
import { uniqueSuffix } from '../helpers/fixtures.ts'
import { DELETE, GET, POST, PUT, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

describe('account (self-service)', () => {
	const suffix = uniqueSuffix()
	const username = `account-${suffix}`
	const email = `${username}@example.com`
	const otherEmail = `other-${suffix}@example.com`
	let ownerToken: string
	let userId: number
	let otherId: number

	async function createUser(name: string, mail: string): Promise<number> {
		const res = await POST('/iam/user/create', {
			token: ownerToken,
			body: { username: name, email: mail, name: 'Account Fixture', password: 'password123' },
		})
		expect(res.status).toBe(200)
		return (await json(res)).data.id
	}

	beforeAll(async () => {
		ownerToken = await loginAs(SEED_USERS.owner.username)
		userId = await createUser(username, email)
		otherId = await createUser(`other-${suffix}`, otherEmail)
	})

	afterAll(async () => {
		for (const id of [userId, otherId]) {
			await DELETE('/iam/user/deactivate', { token: ownerToken, query: { id: String(id) } })
		}
	})

	test('profile update changes name/email for an unassigned user and rejects a duplicate email', async () => {
		const token = await loginAs(username)

		const updated = await PUT('/auth/profile', {
			token,
			body: { name: '  New Name  ', email: `renamed-${suffix}@example.com` },
		})
		expect(updated.status).toBe(200)
		expect((await json(updated)).data).toEqual({ id: userId })

		const me = await json(await GET('/auth/me', { token }))
		expect(me.data.user).toMatchObject({
			username,
			name: 'New Name',
			email: `renamed-${suffix}@example.com`,
			isActive: true,
		})

		const duplicate = await PUT('/auth/profile', {
			token,
			body: { name: 'New Name', email: otherEmail },
		})
		expect(duplicate.status).toBe(409)
		expect((await json(duplicate)).error.code).toBe('EMAIL_EXISTS')
	})

	test('password change validates the current password, then revokes other sessions', async () => {
		const current = await loginAs(username)
		const other = await loginAs(username)

		const wrong = await POST('/auth/password', {
			token: current,
			body: { currentPassword: 'not-the-password', newPassword: 'brand-new-pass' },
		})
		expect(wrong.status).toBe(400)
		expect((await json(wrong)).error.code).toBe('INVALID_CURRENT_PASSWORD')

		const same = await POST('/auth/password', {
			token: current,
			body: { currentPassword: 'password123', newPassword: 'password123' },
		})
		expect(same.status).toBe(400)
		expect((await json(same)).error.code).toBe('PASSWORD_UNCHANGED')

		const changed = await POST('/auth/password', {
			token: current,
			body: { currentPassword: 'password123', newPassword: 'brand-new-pass' },
		})
		expect(changed.status).toBe(200)
		expect((await json(changed)).data.revokedSessions).toBeGreaterThanOrEqual(1)

		expect((await GET('/auth/me', { token: current })).status).toBe(200)
		expect((await GET('/auth/me', { token: other })).status).toBe(401)

		const oldLogin = await POST('/auth/login', { body: { username, password: 'password123' } })
		expect(oldLogin.status).toBe(401)
		await loginAs(username, 'brand-new-pass')
	})
})
