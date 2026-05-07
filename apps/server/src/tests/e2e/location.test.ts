import { testCtx } from '../setup'
import { beforeAll, describe, test, expect } from 'bun:test'
import type { ApiResponse, AuthLoginResponse } from '../helpers/test-types'

/**
 * Serial test
 * - Create location with multiple types (store & warehouse)
 * - Get id from created response id
 * - Update the data
 * - Ensure location exist inside list
 * - Remove store
 */

describe('e2e/location', () => {
	let storeId: number

	beforeAll(async () => {
		const res = await testCtx.client.post('/auth/login', {
			identifier: 'admin@ikki.com',
			password: 'admin12345',
		})
		const json = await testCtx.client.toJsonResponse<ApiResponse<AuthLoginResponse>>(res)
		testCtx.tokens.register('admin', json.data)
	})

	test.serial('create location with multiple types (store & warehouse)', async () => {
		const client = testCtx.client.as('admin')

		// Create store
		const resStore = await client.post('/location/create', {
			name: 'Test Store',
			type: 'store',
			description: 'Test Store Description',
			address: 'Test Store Address',
			phone: '08123456789',
			isActive: true,
		})
		const jsonStore = await client.toJsonResponse<ApiResponse<{ id: number }>>(resStore)
		expect(resStore.status).toBe(200)
		storeId = jsonStore.data.id

		// Create warehouse
		const resWh = await client.post('/location/create', {
			name: 'Test Warehouse',
			type: 'warehouse',
			description: 'Test Warehouse Description',
			address: 'Test Warehouse Address',
			phone: '08123456789',
			isActive: true,
		})
		expect(resWh.status).toBe(200)
	})

	test.serial('update the data', async () => {
		const client = testCtx.client.as('admin')

		const res = await client.put('/location/update', {
			id: storeId,
			name: 'Updated Store',
			type: 'store',
			description: 'Updated Description',
			address: 'Updated Address',
			phone: '08123456789',
			isActive: true,
		})
		expect(res.status).toBe(200)

		const detailRes = await client.get(`/location/detail?id=${storeId}`)
		const detailJson = await client.toJsonResponse<ApiResponse<any>>(detailRes)
		expect(detailJson.data.name).toBe('Updated Store')
	})

	test.serial('ensure location exist inside list', async () => {
		const client = testCtx.client.as('admin')

		const res = await client.get('/location/list')
		const json = await client.toJsonResponse<ApiResponse<any[]>>(res)

		const found = json.data.find((item: any) => item.id === storeId)
		expect(found).toBeDefined()
	})

	test.serial('remove store', async () => {
		const client = testCtx.client.as('admin')

		const res = await client.del('/location/remove', { id: storeId })
		expect(res.status).toBe(200)

		const detailRes = await client.get(`/location/detail?id=${storeId}`)
		expect(detailRes.status).toBe(404)
	})
})