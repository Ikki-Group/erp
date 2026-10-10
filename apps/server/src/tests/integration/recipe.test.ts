import { loginAs } from '../helpers/auth.ts'
import { GET, json } from '../helpers/request.ts'
import { SEED_LOCATION_ID, SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

type RecipeRow = { id: number; menuItemId: number; isActive: boolean; hpp: string | null }

describe('recipe list hpp', () => {
	let token: string

	beforeAll(async () => {
		token = await loginAs(SEED_USERS.owner.username)
	})

	test('without locationId, rows carry hpp: null', async () => {
		const res = await GET('/recipe/list', { token, query: { page: '1', limit: '50' } })
		expect(res.status).toBe(200)
		const body = await json<{ data: RecipeRow[] }>(res)
		expect(body.data.length).toBeGreaterThan(0)
		for (const row of body.data) expect(row.hpp).toBeNull()
	})

	test('with locationId, each active row matches the single-recipe hpp endpoint', async () => {
		const locationId = String(SEED_LOCATION_ID)
		const res = await GET('/recipe/list', {
			token,
			query: { page: '1', limit: '50', locationId },
		})
		expect(res.status).toBe(200)
		const rows = (await json<{ data: RecipeRow[] }>(res)).data
		const active = rows.filter((r) => r.isActive)
		expect(active.length).toBeGreaterThan(0)

		for (const row of active) {
			expect(row.hpp).toBeString()
			const single = await GET('/recipe/hpp', {
				token,
				query: { menuItemId: String(row.menuItemId), locationId },
			})
			expect(single.status).toBe(200)
			expect((await json(single)).data.hpp).toBe(row.hpp)
		}
	})
})
