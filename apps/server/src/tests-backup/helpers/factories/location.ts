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

export async function createLocation(
	overrides: Partial<{
		code: string
		name: string
		type: 'warehouse' | 'store'
		description: string
		address: string
		phone: string
		isActive: boolean
	}> = {},
) {
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
