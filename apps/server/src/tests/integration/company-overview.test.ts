import { loginAs } from '../helpers/auth.ts'
import {
	SEED_SUPPLIER_ID,
	createAssignedMaterial,
	createLocation,
	uomIds,
} from '../helpers/fixtures.ts'
import { GET, POST, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

interface Site {
	id: number
	type: string
	staff: number
	draftReceivings: number
	salesToday: { orders: number; revenue: string }
}

async function overview(token: string) {
	const response = await GET('/company/overview', { token })
	expect(response.status).toBe(200)
	return (await json(response)).data
}

describe('company overview', () => {
	test('owner sees locations, people and per-site metrics', async () => {
		const owner = await loginAs(SEED_USERS.owner.username)
		const data = await overview(owner)

		expect(data.businessDate).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
		expect(data.people).not.toBeNull()
		expect(data.locations.total).toBe(data.sites.length)
		expect(data.locations.stores + data.locations.warehouses).toBe(data.locations.total)
		expect(data.sites.length).toBeGreaterThan(0)
		for (const site of data.sites as Site[]) {
			expect(site.salesToday.revenue).toMatch(/^\d+\.\d{2}$/u)
		}
	})

	test('a draft receiving counts only at its own location', async () => {
		const owner = await loginAs(SEED_USERS.owner.username)
		const locationId = await createLocation(owner, 'warehouse')
		const uomId = (await uomIds(owner)).kg
		const materialId = await createAssignedMaterial(owner, {
			baseUomId: uomId,
			locationIds: [locationId],
		})

		const created = await POST('/inventory/receiving/create', {
			token: owner,
			body: {
				locationId,
				supplierId: SEED_SUPPLIER_ID,
				lines: [{ materialId, qty: '1', unitCost: '1000', uomId }],
			},
		})
		expect(created.status).toBe(200)

		const data = await overview(owner)
		const site = (data.sites as Site[]).find((s) => s.id === locationId)
		expect(site).toMatchObject({
			type: 'warehouse',
			draftReceivings: 1,
			staff: 0,
			salesToday: { orders: 0, revenue: '0.00' },
		})
	})

	test('cashier cannot read the overview', async () => {
		const response = await GET('/company/overview', {
			token: await loginAs(SEED_USERS.cashier.username),
		})
		expect(response.status).toBe(403)
	})
})
