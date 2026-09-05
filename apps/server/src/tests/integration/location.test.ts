import { loginAs } from '../helpers/auth.ts'
import { DELETE, GET, POST, PUT, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

describe('location', () => {
	test('create → get → update → list → soft delete', async () => {
		const cookie = await loginAs(SEED_USERS.owner.username)
		const suffix = crypto.randomUUID().slice(0, 8)
		const code = `TEST-${suffix}`
		const created = await POST('/location/create', {
			cookie,
			body: {
				code,
				name: `Test Location ${suffix}`,
				type: 'store',
				address: 'Test address',
				phone: null,
				isActive: true,
			},
		})

		expect(created.status).toBe(200)
		const createdBody = await json(created)
		const id = createdBody.data.id

		const detail = await GET('/location/detail', { cookie, query: { id: String(id) } })
		expect(detail.status).toBe(200)
		expect((await json(detail)).data.code).toBe(code)

		const updated = await PUT('/location/update', {
			cookie,
			body: {
				id,
				code,
				name: `Updated Location ${suffix}`,
				type: 'warehouse',
				address: 'Updated address',
				phone: '021-0000',
				isActive: true,
			},
		})
		expect(updated.status).toBe(200)

		const listed = await GET('/location/list', { cookie, query: { q: suffix } })
		expect(listed.status).toBe(200)
		expect((await json(listed)).data[0].name).toBe(`Updated Location ${suffix}`)

		const removed = await DELETE('/location/remove', { cookie, query: { id: String(id) } })
		expect(removed.status).toBe(200)
		const afterDelete = await GET('/location/detail', { cookie, query: { id: String(id) } })
		expect(afterDelete.status).toBeGreaterThanOrEqual(400)
	})
})
