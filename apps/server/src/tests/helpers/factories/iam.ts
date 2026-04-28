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

export async function createUser(
	overrides: Partial<{
		email: string
		username: string
		passwordHash: string
		fullname: string
		isActive: boolean
		isRoot: boolean
	}> = {},
) {
	const db = getTestDatabase()
	const { usersTable } = await import('@/db/schema/iam')

	const data = {
		email: overrides.email ?? `test-${generateId()}@example.com`,
		username: overrides.username ?? `user-${generateId()}`,
		passwordHash: overrides.passwordHash ?? 'hashed-password-placeholder',
		fullname: overrides.fullname ?? 'Test User',
		isActive: overrides.isActive ?? true,
		isRoot: overrides.isRoot ?? false,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	const result = await db.insert(usersTable).values(data).returning({ id: usersTable.id })
	if (!result[0]) throw new Error('Failed to create user')
	return { id: result[0].id, ...data }
}

export async function createSuperadminRole() {
	const db = getTestDatabase()
	const { rolesTable } = await import('@/db/schema/iam')

	const data = {
		id: 1, // Superadmin role ID
		code: 'SUPERADMIN',
		name: 'Superadmin',
		description: 'System superadmin with full access',
		permissions: ['*'], // All permissions
		isSystem: true,
		createdBy: SYSTEM_USER_ID,
		updatedBy: SYSTEM_USER_ID,
	}

	try {
		const result = await db.insert(rolesTable).values(data).returning()
		if (!result[0]) throw new Error('Failed to create superadmin role')
		return result[0]
	} catch (error) {
		// Role might already exist, try to fetch it
		const { eq } = await import('drizzle-orm')
		const existing = await db.select().from(rolesTable).where(eq(rolesTable.id, 1)).limit(1)
		if (existing.length > 0) return existing[0]
		throw error
	}
}

export async function createRole(
	overrides: Partial<{
		name: string
		code: string
		description: string
		isSystem: boolean
	}> = {},
) {
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

export async function createSession(
	userId: number,
	overrides: Partial<{
		expiredAt: Date
	}> = {},
) {
	const db = getTestDatabase()
	const { sessionsTable } = await import('@/db/schema/iam')

	const data = {
		userId,
		expiredAt: overrides.expiredAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
	}

	const result = await db.insert(sessionsTable).values(data).returning({ id: sessionsTable.id })
	if (!result[0]) throw new Error('Failed to create session')
	return { id: result[0].id, ...data }
}
