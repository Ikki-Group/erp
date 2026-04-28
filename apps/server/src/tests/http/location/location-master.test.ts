import { createTestApp, jsonRequest } from '@/tests/helpers/app-builder'
import { Factory } from '@/tests/helpers/factories'
import { expectSuccessResponse } from '@/tests/helpers/response'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('Location Master HTTP Endpoints', () => {
	describe('Create Location', () => {
		it('creates a new location successfully', async () => {
			// Arrange
			const createApp = createTestApp((_app) => {
				const { initLocationRouteModule } = require('@/modules/location')
				return initLocationRouteModule()
			})

			const createData = {
				code: 'TEST-LOC-001',
				name: 'Test Location',
				type: 'warehouse' as const,
				address: 'Test Address',
				phone: '1234567890',
			}

			// Act
			const res = await createApp.handle(jsonRequest('POST', '/location/master/create', createData))

			// Assert
			expect(res.status).toBe(200)
			const body = await res.json()
			expectSuccessResponse(body)
			const data = body.data as { code: string; name: string }
			expect(data).toBeDefined()
			expect(data.code).toBe(createData.code)
			expect(data.name).toBe(createData.name)
		})

		it('creates location with minimal data', async () => {
			// Arrange
			const createApp = createTestApp((_app) => {
				const { initLocationRouteModule } = require('@/modules/location')
				return initLocationRouteModule()
			})

			const createData = {
				code: 'TEST-LOC-002',
				name: 'Minimal Location',
				type: 'store' as const,
			}

			// Act
			const res = await createApp.handle(jsonRequest('POST', '/location/master/create', createData))

			// Assert
			expect(res.status).toBe(200)
			const body = await res.json()
			expectSuccessResponse(body)
			const data = body.data as { code: string; name: string }
			expect(data).toBeDefined()
		})
	})

	describe('List Locations', () => {
		it('lists all locations', async () => {
			// Arrange
			await Factory.location({ code: 'LIST-LOC-001', name: 'List Test 1' })
			await Factory.location({ code: 'LIST-LOC-002', name: 'List Test 2' })

			const createApp = createTestApp((_app) => {
				const { initLocationRouteModule } = require('@/modules/location')
				return initLocationRouteModule()
			})

			// Act
			const res = await createApp.handle(jsonRequest('GET', '/location/master/list'))

			// Assert
			expect(res.status).toBe(200)
			const body = await res.json()
			expectSuccessResponse(body)
			const listData = body.data as { items: Array<{ code: string }> }
			expect(listData.items).toBeArray()
			expect(listData.items.length).toBeGreaterThan(0)
		})

		it('filters locations by type', async () => {
			// Arrange
			await Factory.location({ code: 'FILTER-WH-001', name: 'Warehouse Test', type: 'warehouse' })
			await Factory.location({ code: 'FILTER-ST-001', name: 'Store Test', type: 'store' })

			const createApp = createTestApp((_app) => {
				const { initLocationRouteModule } = require('@/modules/location')
				return initLocationRouteModule()
			})

			// Act
			const res = await createApp.handle(jsonRequest('GET', '/location/master/list?type=warehouse'))

			// Assert
			expect(res.status).toBe(200)
			const body = await res.json()
			expectSuccessResponse(body)
			const listData = body.data as { items: Array<{ type: string }> }
			expect(listData.items).toBeArray()
			expect(listData.items.every((item) => item.type === 'warehouse')).toBe(true)
		})
	})

	describe('Get Location Detail', () => {
		it('gets location by id', async () => {
			// Arrange
			const location = await Factory.location({ code: 'DETAIL-LOC-001', name: 'Detail Test' })

			const createApp = createTestApp((_app) => {
				const { initLocationRouteModule } = require('@/modules/location')
				return initLocationRouteModule()
			})

			// Act
			const res = await createApp.handle(
				jsonRequest('GET', `/location/master/detail?id=${location.id}`),
			)

			// Assert
			expect(res.status).toBe(200)
			const body = await res.json()
			expectSuccessResponse(body)
			const data = body.data as { id: number; code: string }
			expect(data).toBeDefined()
			expect(data.id).toBe(location.id)
			expect(data.code).toBe(location.code)
		})
	})

	describe('Update Location', () => {
		it('updates location successfully', async () => {
			// Arrange
			const location = await Factory.location({ code: 'UPDATE-LOC-001', name: 'Original Name' })

			const createApp = createTestApp((_app) => {
				const { initLocationRouteModule } = require('@/modules/location')
				return initLocationRouteModule()
			})

			const updateData = {
				id: location.id,
				name: 'Updated Name',
				phone: '9876543210',
			}

			// Act
			const res = await createApp.handle(jsonRequest('PUT', '/location/master/update', updateData))

			// Assert
			expect(res.status).toBe(200)
			const body = await res.json()
			expectSuccessResponse(body)
			const data = body.data as { name: string; phone: string }
			expect(data).toBeDefined()
			expect(data.name).toBe(updateData.name)
			expect(data.phone).toBe(updateData.phone)
		})
	})
})
