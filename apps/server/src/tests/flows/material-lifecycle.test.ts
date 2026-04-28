import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'
import { createMockAuthPlugin } from '@/tests/helpers/auth'
import { setupIntegrationTests, Factory } from '@/tests/helpers'
import { expectSuccessResponse, expectPaginatedResponse } from '@/tests/helpers/response'

import { initMaterialMasterRoute } from '@/modules/material/material-master/material.route'
import { MaterialService } from '@/modules/material/material-master/material.service'
import { MaterialRepo } from '@/modules/material/material-master/material.repo'
import { MaterialLocationRepo } from '@/modules/material/material-location/material-location.repo'
import { MaterialCategoryService } from '@/modules/material/material-category/material-category.service'
import { UomService } from '@/modules/material/uom/uom.service'
import { LocationServiceModule } from '@/modules/location'

// Setup test lifecycle
setupIntegrationTests()

// Create test app with real services - manual construction to avoid Elysia type issues
function createMaterialTestApp() {
	// Dependencies
	const categoryService = new MaterialCategoryService()
	const uomService = new UomService()
	const locationModule = new LocationServiceModule()

	// Repos
	const materialRepo = new MaterialRepo()
	const materialLocationRepo = new MaterialLocationRepo()

	// Service
	const materialService = new MaterialService(
		categoryService,
		uomService,
		locationModule.master,
		materialRepo,
		materialLocationRepo
	)

	// Manual app construction (same pattern as location-master.test.ts)
	const app = new Elysia()
		.use(errorHandler)
		.use(requestIdPlugin())
		.use(cors())
		.use(createMockAuthPlugin())
		.use(initMaterialMasterRoute(materialService))

	return app
}

describe('Material Lifecycle Flow', () => {
	it('complete flow: create → verify in list → update → verify changes', async () => {
		const app = createMaterialTestApp()

		// Step 1: Create dependencies (UOM, Category)
		const uom = await Factory.uom({ code: 'KG-FLOW' })
		const category = await Factory.materialCategory({ name: 'Raw Material Flow' })

		// Step 2: Create Material
		const createRes = await app.handle(
			new Request('http://localhost/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sku: 'MAT-FLOW-001',
					name: 'Test Material Flow',
					description: 'Material for lifecycle test',
					type: 'raw',
					baseUomId: uom.id,
					categoryId: category.id,
					conversions: [],
					locationIds: [],
				}),
			})
		)

		expect(createRes.status).toBe(200)
		const createBody = await createRes.json()
		expectSuccessResponse(createBody)
		const materialId = (createBody.data as { id: number }).id

		// Step 3: Verify material appears in list
		const listRes = await app.handle(
			new Request('http://localhost/list?page=1&limit=10')
		)

		expect(listRes.status).toBe(200)
		const listBody = await listRes.json()
		expectPaginatedResponse(listBody)
		const foundMaterial = (listBody.data as Array<{ id: number; sku: string }>).find(
			m => m.id === materialId
		)
		expect(foundMaterial).toBeDefined()
		expect(foundMaterial?.sku).toBe('MAT-FLOW-001')

		// Step 4: Get material detail
		const detailRes = await app.handle(
			new Request(`http://localhost/detail?id=${materialId}`)
		)

		expect(detailRes.status).toBe(200)
		const detailBody = await detailRes.json()
		expectSuccessResponse(detailBody)
		expect((detailBody.data as { name: string }).name).toBe('Test Material Flow')

		// Step 5: Update material
		const updateRes = await app.handle(
			new Request('http://localhost/update', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: materialId,
					sku: 'MAT-FLOW-001',
					name: 'Updated Material Flow',
					description: 'Updated description',
					type: 'raw',
					baseUomId: uom.id,
					categoryId: category.id,
					conversions: [],
					locationIds: [],
				}),
			})
		)

		expect(updateRes.status).toBe(200)
		const updateBody = await updateRes.json()
		expectSuccessResponse(updateBody)

		// Step 6: Verify changes persisted by fetching detail again
		const verifyRes = await app.handle(
			new Request(`http://localhost/detail?id=${materialId}`)
		)

		expect(verifyRes.status).toBe(200)
		const verifyBody = await verifyRes.json()
		expectSuccessResponse(verifyBody)
		expect((verifyBody.data as { name: string }).name).toBe('Updated Material Flow')
		expect((verifyBody.data as { description: string }).description).toBe('Updated description')
	})
})
