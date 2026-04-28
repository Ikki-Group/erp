import { getTestDatabase } from './db'

// System user ID for test data creation
const SYSTEM_USER_ID = 1

/**
 * Seeds reference data that should be available in all tests.
 * Call this in beforeAll hook to ensure stable test environment.
 *
 * Seeded data:
 * - Roles (SuperAdmin, Manager)
 * - UOMs (KG, G, PCS, L, ML)
 * - Basic Locations (Main Warehouse, Store One)
 */
export async function seedReferenceData(): Promise<void> {
	const db = getTestDatabase()

	// Seed Roles
	const { rolesTable } = await import('@/db/schema/iam')
	await db
		.insert(rolesTable)
		.values([
			{
				code: 'SUPERADMIN',
				name: 'Administrator',
				description: 'Super administrator',
				permissions: ['*'],
				isSystem: true,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
			{
				code: 'MANAGER',
				name: 'Manager',
				description: null,
				permissions: [],
				isSystem: false,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
		])
		.onConflictDoNothing()

	// Seed UOMs
	const { uomsTable } = await import('@/db/schema/material')
	await db
		.insert(uomsTable)
		.values([
			{ code: 'KG', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
			{ code: 'G', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
			{ code: 'PCS', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
			{ code: 'L', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
			{ code: 'ML', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
		])
		.onConflictDoNothing()

	// Seed Basic Locations
	const { locationsTable } = await import('@/db/schema/location')
	await db
		.insert(locationsTable)
		.values([
			{
				code: 'WH-MAIN',
				name: 'Main Warehouse',
				type: 'warehouse',
				address: null,
				phone: null,
				isActive: true,
				description: null,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
			{
				code: 'STORE-01',
				name: 'Store One',
				type: 'store',
				address: null,
				phone: null,
				isActive: true,
				description: null,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
		])
		.onConflictDoNothing()
}

/**
 * Seeds development mock data (categories, materials).
 * Use this for development tests that need realistic data.
 */
export async function seedDevData(): Promise<void> {
	const db = getTestDatabase()

	// Get UOMs
	const uoms = await db.query.uomsTable.findMany()
	const getUomId = (code: string) => uoms.find((u) => u.code === code)?.id ?? 1

	// Seed Material Categories
	const { materialCategoriesTable } = await import('@/db/schema/material')
	const categories = await db
		.insert(materialCategoriesTable)
		.values([
			{
				name: 'Coffee Beans',
				description: 'Premium selected coffee beans',
				parentId: null,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
			{
				name: 'Dairy & Milk',
				description: 'Milk-based products',
				parentId: null,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
			{
				name: 'Packaging',
				description: 'Product packaging materials',
				parentId: null,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
		])
		.returning()
		.onConflictDoNothing()

	// Seed Materials (simplified version)
	const { materialsTable } = await import('@/db/schema/material')
	const categoryId = categories.length > 0 ? (categories[0]?.id ?? 1) : 1
	await db
		.insert(materialsTable)
		.values([
			{
				sku: 'RAW-COF-001',
				name: 'Arabica Beans - Flores',
				type: 'raw',
				categoryId,
				baseUomId: getUomId('G'),
				description: null,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
			{
				sku: 'RAW-COF-002',
				name: 'Robusta Beans - Dampit',
				type: 'raw',
				categoryId,
				baseUomId: getUomId('G'),
				description: null,
				createdBy: SYSTEM_USER_ID,
				updatedBy: SYSTEM_USER_ID,
			},
		])
		.onConflictDoNothing()
}
