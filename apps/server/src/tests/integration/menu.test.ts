import { loginAs } from '../helpers/auth.ts'
import { createLocation, expectError, uniqueSuffix } from '../helpers/fixtures.ts'
import { POST } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

describe('menu', () => {
	test('category name is unique per location, not globally', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const storeA = await createLocation(token, 'store')
		const storeB = await createLocation(token, 'store')
		const name = `Kategori ${uniqueSuffix()}`

		const first = await POST('/menu/category/create', {
			token,
			body: { locationId: storeA, name, sortOrder: 0 },
		})
		expect(first.status).toBe(200)

		const second = await POST('/menu/category/create', {
			token,
			body: { locationId: storeB, name, sortOrder: 0 },
		})
		expect(second.status).toBe(200)

		const duplicate = await POST('/menu/category/create', {
			token,
			body: { locationId: storeA, name, sortOrder: 0 },
		})
		await expectError(duplicate, 409, 'MENU_CATEGORY_NAME_EXISTS')
	})

	test('modifier group name is unique per location, not globally', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const storeA = await createLocation(token, 'store')
		const storeB = await createLocation(token, 'store')
		const name = `Grup ${uniqueSuffix()}`

		for (const locationId of [storeA, storeB]) {
			const created = await POST('/menu/modifier/create', {
				token,
				body: { locationId, name, options: [{ name: 'Panas' }] },
			})
			expect(created.status).toBe(200)
		}

		const duplicate = await POST('/menu/modifier/create', {
			token,
			body: { locationId: storeA, name, options: [{ name: 'Panas' }] },
		})
		await expectError(duplicate, 409, 'MODIFIER_GROUP_NAME_EXISTS')
	})
})
