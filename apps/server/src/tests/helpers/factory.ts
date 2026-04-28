import { getTestDatabase } from './db'

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

// ==================== User / IAM Factories ====================

export async function createUser(overrides: Partial<{
	email: string
	username: string
	passwordHash: string
	fullname: string
	isActive: boolean
}> = {}) {
	const db = getTestDatabase()
	const { usersTable } = await import('@/db/schema/iam')

	const data = {
		email: overrides.email ?? `test-${generateId()}@example.com`,
		username: overrides.username ?? `user-${generateId()}`,
		passwordHash: overrides.passwordHash ?? 'hashed-password-placeholder',
		fullname: overrides.fullname ?? 'Test User',
		isActive: overrides.isActive ?? true,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(usersTable).values(data).returning({ id: usersTable.id })
	if (!result[0]) throw new Error('Failed to create user')
	return { id: result[0].id, ...data }
}

export async function createRole(overrides: Partial<{
	name: string
	code: string
	description: string
	isSystem: boolean
}> = {}) {
	const db = getTestDatabase()
	const { rolesTable } = await import('@/db/schema/iam')

	const data = {
		name: overrides.name ?? `Role ${generateId()}`,
		code: overrides.code ?? generateCode('ROLE'),
		description: overrides.description ?? null,
		isSystem: overrides.isSystem ?? false,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(rolesTable).values(data).returning({ id: rolesTable.id })
	if (!result[0]) throw new Error('Failed to create role')
	return { id: result[0].id, ...data }
}

// ==================== Location Factories ====================

export async function createLocation(overrides: Partial<{
	code: string
	name: string
	type: 'warehouse' | 'store'
	description: string
	address: string
	phone: string
	isActive: boolean
}> = {}) {
	const db = getTestDatabase()
	const { locationsTable } = await import('@/db/schema/location')

	const data = {
		code: overrides.code ?? generateCode('LOC'),
		name: overrides.name ?? `Test Location ${generateId()}`,
		type: overrides.type ?? 'warehouse',
		description: overrides.description ?? null,
		address: overrides.address ?? null,
		phone: overrides.phone ?? null,
		isActive: overrides.isActive ?? true,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(locationsTable).values(data).returning({ id: locationsTable.id })
	if (!result[0]) throw new Error('Failed to create location')
	return { id: result[0].id, ...data }
}

// ==================== Material Factories ====================

export async function createMaterialCategory(overrides: Partial<{
	name: string
	description: string
	parentId: number | null
}> = {}) {
	const db = getTestDatabase()
	const { materialCategoriesTable } = await import('@/db/schema/material')

	const data = {
		name: overrides.name ?? `Category ${generateId()}`,
		description: overrides.description ?? null,
		parentId: overrides.parentId ?? null,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(materialCategoriesTable).values(data).returning({ id: materialCategoriesTable.id })
	if (!result[0]) throw new Error('Failed to create material category')
	return { id: result[0].id, ...data }
}

export async function createUom(overrides: Partial<{
	code: string
}> = {}) {
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

export async function createMaterial(overrides: Partial<{
	sku: string
	name: string
	description: string
	type: 'raw' | 'semi' | 'packaging'
	baseUomId: number
	categoryId: number
}> = {}) {
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

// ==================== Product Factories ====================

export async function createProductCategory(overrides: Partial<{
	name: string
	description: string
	parentId: number | null
}> = {}) {
	const db = getTestDatabase()
	const { productCategoriesTable } = await import('@/db/schema/product')

	const data = {
		name: overrides.name ?? `Product Category ${generateId()}`,
		description: overrides.description ?? null,
		parentId: overrides.parentId ?? null,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(productCategoriesTable).values(data).returning({ id: productCategoriesTable.id })
	if (!result[0]) throw new Error('Failed to create product category')
	return { id: result[0].id, ...data }
}

export async function createProduct(overrides: Partial<{
	sku: string
	name: string
	description: string
	locationId: number
	categoryId: number
	basePrice: string
	isActive: boolean
}> = {}) {
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

// ==================== Builder API (Chainable) ====================

export const Factory = {
	user: createUser,
	role: createRole,
	location: createLocation,
	materialCategory: createMaterialCategory,
	uom: createUom,
	material: createMaterial,
	productCategory: createProductCategory,
	product: createProduct,
}

// Default export for convenience
export default Factory
