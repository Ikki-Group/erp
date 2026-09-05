import { loginAs } from '../helpers/auth.ts'
import { GET, PUT, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

describe('company', () => {
	test('owner can read company settings', async () => {
		const response = await GET('/company/settings', {
			cookie: await loginAs(SEED_USERS.owner.username),
		})

		expect(response.status).toBe(200)
		const body = await json(response)
		expect(body.success).toBe(true)
		expect(body.data.name).toBe('Kedai Kopi Nusantara')
		expect(body.data.taxRate).toBe('11.00')
	})

	test('cashier cannot update company settings', async () => {
		const response = await PUT('/company/settings', {
			cookie: await loginAs(SEED_USERS.cashier.username),
			body: {
				id: 1,
				name: 'Unauthorized update',
				address: null,
				phone: null,
				email: null,
				taxId: null,
				taxRate: '11.00',
				currencyCode: 'IDR',
				currencySymbol: 'Rp',
				logoUrl: null,
				receiptFooter: null,
			},
		})

		expect(response.status).toBe(403)
		expect(await json(response)).toMatchObject({
			success: false,
			error: { code: 'PERMISSION_DENIED' },
		})
	})
})
