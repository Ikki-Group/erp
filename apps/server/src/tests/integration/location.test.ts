import { loginAs } from '../helpers/auth.ts'
import { expectError, uniqueSuffix } from '../helpers/fixtures.ts'
import { DELETE, GET, POST, PUT, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

describe('location', () => {
	test('create → get → update → list → soft delete', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const suffix = crypto.randomUUID().slice(0, 8)
		const code = `TEST-${suffix}`
		const created = await POST('/location/create', {
			token,
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

		const detail = await GET('/location/detail', { token, query: { id: String(id) } })
		expect(detail.status).toBe(200)
		expect((await json(detail)).data.code).toBe(code)

		const updated = await PUT('/location/update', {
			token,
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

		const listed = await GET('/location/list', { token, query: { q: suffix } })
		expect(listed.status).toBe(200)
		expect((await json(listed)).data[0].name).toBe(`Updated Location ${suffix}`)

		const removed = await DELETE('/location/remove', { token, query: { id: String(id) } })
		expect(removed.status).toBe(200)

		// The admin list is an archive: an inactive location stays listed and the
		// status filter narrows to active or inactive rows.
		const all = await GET('/location/list', { token, query: { q: suffix } })
		expect((await json<{ data: { id: number }[] }>(all)).data.map((row) => row.id)).toEqual([id])

		const inactive = await GET('/location/list', {
			token,
			query: { q: suffix, isActive: '0' },
		})
		expect((await json<{ data: { id: number }[] }>(inactive)).data.map((row) => row.id)).toEqual([
			id,
		])

		const activeOnly = await GET('/location/list', {
			token,
			query: { q: suffix, isActive: '1' },
		})
		expect((await json<{ data: { id: number }[] }>(activeOnly)).data).toEqual([])

		// An inactive location stays openable so an administrator can reactivate it
		// (the company overview links to inactive sites).
		const afterDelete = await GET('/location/detail', { token, query: { id: String(id) } })
		expect(afterDelete.status).toBe(200)
		expect((await json<{ data: { isActive: boolean } }>(afterDelete)).data.isActive).toBe(false)

		const reactivated = await PUT('/location/update', {
			token,
			body: {
				id,
				code,
				name: `Reactivated Location ${suffix}`,
				type: 'warehouse',
				address: null,
				phone: null,
				isActive: true,
			},
		})
		expect(reactivated.status).toBe(200)

		const relisted = await GET('/location/list', { token, query: { q: suffix } })
		expect((await json<{ data: { id: number }[] }>(relisted)).data.map((row) => row.id)).toEqual([
			id,
		])
	})

	test('search matches LIKE metacharacters literally', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const suffix = crypto.randomUUID().slice(0, 8)
		const name = `Lit ${suffix} 50%_\\off`
		const created = await POST('/location/create', {
			token,
			body: { code: `LIT-${suffix}`, name, type: 'store', isActive: true },
		})
		expect(created.status).toBe(200)

		const names = async (q: string) => {
			const res = await GET('/location/list', { token, query: { q, limit: '100' } })
			expect(res.status).toBe(200)
			return (await json<{ data: { name: string }[] }>(res)).data.map((row) => row.name)
		}
		expect(await names(`${suffix} 50%_\\off`)).toEqual([name])
		// A trailing backslash must not become a dangling escape (Postgres error).
		expect(await names(`${suffix} 50%_\\`)).toEqual([name])
		// `%` / `_` / `\` are literal: these patterns would match the row as wildcards.
		expect(await names(`${suffix} 5_%`)).toEqual([])
		expect(await names(`${suffix} \\5`)).toEqual([])
	})

	test('an inactive location rejects new records', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const suffix = uniqueSuffix()
		const created = await POST('/location/create', {
			token,
			body: { code: `INA-${suffix}`, name: `Inactive ${suffix}`, type: 'store', isActive: true },
		})
		const id = (await json<{ data: { id: number } }>(created)).data.id

		const removed = await DELETE('/location/remove', { token, query: { id: String(id) } })
		expect(removed.status).toBe(200)

		const userRes = await GET('/iam/user/list', { token, query: { q: 'multi-location' } })
		const userId = (await json<{ data: { id: number }[] }>(userRes)).data[0]!.id
		const roleRes = await GET('/iam/role/list', { token, query: { q: 'manager' } })
		const roleId = (await json<{ data: { id: number }[] }>(roleRes)).data[0]!.id

		// Writes guarded by `handleGetById` keep treating the deactivated site as absent.
		const assigned = await POST('/iam/assignment/assign', {
			token,
			body: { userId, roleId, locationId: id },
		})
		await expectError(assigned, 404, 'LOCATION_NOT_FOUND')
	})
})
