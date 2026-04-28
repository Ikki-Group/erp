import { getTestDatabase } from '../db'
import { createLocation } from './location'

// Simple ID generator for test data
let counter = 0
function generateId(): number {
	return ++counter + Date.now()
}

function generateCode(prefix: string): string {
	return `${prefix}-${generateId()}`
}

// System user ID for test data creation
const SYSTEM_USER_ID = 1

export async function createProductCategory(
	overrides: Partial<{
		name: string
		description: string
		parentId: number | null
	}> = {},
) {
	const db = getTestDatabase()
	const { productCategoriesTable } = await import('@/db/schema/product')

	const data = {
		name: overrides.name ?? `Product Category ${generateId()}`,
		description: overrides.description ?? null,
		parentId: overrides.parentId ?? null,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db
		.insert(productCategoriesTable)
		.values(data)
		.returning({ id: productCategoriesTable.id })
	if (!result[0]) throw new Error('Failed to create product category')
	return { id: result[0].id, ...data }
}

export async function createProduct(
	overrides: Partial<{
		sku: string
		name: string
		description: string
		locationId: number
		categoryId: number
		basePrice: string
		isActive: boolean
	}> = {},
) {
	const db = getTestDatabase()
	const { productsTable } = await import('@/db/schema/product')

	let categoryId = overrides.categoryId
	if (!categoryId) {
		const category = await createProductCategory()
		categoryId = category.id
	}

	let locationId = overrides.locationId
	if (!locationId) {
		const location = await createLocation()
		locationId = location.id
	}

	const data = {
		sku: overrides.sku ?? generateCode('PROD'),
		name: overrides.name ?? `Product ${generateId()}`,
		description: overrides.description ?? null,
		locationId,
		categoryId,
		basePrice: overrides.basePrice ?? '0',
		isActive: overrides.isActive ?? true,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(productsTable).values(data).returning({ id: productsTable.id })
	if (!result[0]) throw new Error('Failed to create product')
	return { id: result[0].id, ...data }
}
