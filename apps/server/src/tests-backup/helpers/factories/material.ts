import { getTestDatabase } from '../db'

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

export async function createMaterialCategory(
	overrides: Partial<{
		name: string
		description: string
		parentId: number | null
	}> = {},
) {
	const db = getTestDatabase()
	const { materialCategoriesTable } = await import('@/db/schema/material')

	const data = {
		name: overrides.name ?? `Category ${generateId()}`,
		description: overrides.description ?? null,
		parentId: overrides.parentId ?? null,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db
		.insert(materialCategoriesTable)
		.values(data)
		.returning({ id: materialCategoriesTable.id })
	if (!result[0]) throw new Error('Failed to create material category')
	return { id: result[0].id, ...data }
}

export async function createUom(
	overrides: Partial<{
		code: string
	}> = {},
) {
	const db = getTestDatabase()
	const { uomsTable } = await import('@/db/schema/material')

	const data = {
		code: overrides.code ?? `UOM-${generateId()}`,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(uomsTable).values(data).returning({ id: uomsTable.id })
	if (!result[0]) throw new Error('Failed to create UOM')
	return { id: result[0].id, ...data }
}

export async function createMaterial(
	overrides: Partial<{
		sku: string
		name: string
		description: string
		type: 'raw' | 'semi' | 'packaging'
		baseUomId: number
		categoryId: number
	}> = {},
) {
	const db = getTestDatabase()
	const { materialsTable } = await import('@/db/schema/material')

	// Create dependencies if not provided
	let baseUomId = overrides.baseUomId
	if (!baseUomId) {
		const uom = await createUom()
		baseUomId = uom.id
	}

	let categoryId = overrides.categoryId
	if (!categoryId) {
		const category = await createMaterialCategory()
		categoryId = category.id
	}

	const data = {
		sku: overrides.sku ?? generateCode('MAT'),
		name: overrides.name ?? `Material ${generateId()}`,
		description: overrides.description ?? null,
		type: overrides.type ?? 'raw',
		baseUomId,
		categoryId,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(materialsTable).values(data).returning({ id: materialsTable.id })
	if (!result[0]) throw new Error('Failed to create material')
	return { id: result[0].id, ...data }
}
