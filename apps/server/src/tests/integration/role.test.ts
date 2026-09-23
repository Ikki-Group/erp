import { loginAs } from '../helpers/auth.ts'
import { DELETE, GET, POST, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

describe('iam roles', () => {
	test('rejects permissions outside the canonical catalog', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const response = await POST('/iam/role/create', {
			token,
			body: {
				code: `invalid-permission-${Date.now()}`,
				name: 'Invalid Permission Role',
				permissions: ['admin.delete.everything'],
			},
		})

		expect(response.status).toBe(422)
	})

	test('deletes an unassigned custom role from the catalog', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const code = `delete-me-${Date.now()}`
		const createResponse = await POST('/iam/role/create', {
			token,
			body: {
				code,
				name: 'Delete Me',
				description: 'Temporary role used by the integration test.',
				permissions: ['iam.read'],
			},
		})
		expect(createResponse.status).toBe(201)
		const created = await json<{ data: { id: number } }>(createResponse)

		const deleteResponse = await DELETE('/iam/role/remove', {
			token,
			query: { id: String(created.data.id) },
		})
		expect(deleteResponse.status).toBe(200)

		const listResponse = await GET('/iam/role/list', {
			token,
			query: { q: code, page: '1', limit: '10' },
		})
		const listed = await json<{ data: unknown[] }>(listResponse)
		expect(listed.data).toHaveLength(0)
	})

	test('does not allow deleting a system role', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const listResponse = await GET('/iam/role/list', {
			token,
			query: { q: 'owner', page: '1', limit: '10' },
		})
		const listed = await json<{ data: Array<{ id: number; isSystem: boolean }> }>(listResponse)
		const owner = listed.data.find((role) => role.isSystem)
		expect(owner).toBeDefined()

		const deleteResponse = await DELETE('/iam/role/remove', {
			token,
			query: { id: String(owner!.id) },
		})
		expect(deleteResponse.status).toBe(403)
	})
})
