/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Roles, Users, User Assignments
 */
import type { LocationIds } from './core.ts'
import type { Sql } from 'postgres'

export interface RoleIds {
	owner: number
	manager: number
	cashier: number
	warehouseStaff: number
}

export interface UserIds {
	owner: number
	manager: number
	cashier: number
	warehouseStaff: number
}

// ─── Roles ───

const ROLES = [
	{
		code: 'owner',
		name: 'Owner',
		isSystem: 1,
		permissions: JSON.stringify([
			'company:read',
			'company:write',
			'location:read',
			'location:write',
			'iam:read',
			'iam:write',
			'uom:read',
			'uom:write',
			'material:read',
			'material:write',
			'supplier:read',
			'supplier:write',
			'menu:read',
			'menu:write',
			'recipe:read',
			'recipe:write',
			'payment-method:read',
			'payment-method:write',
			'pos:read',
			'pos:write',
			'pos:void',
			'inventory:read',
			'inventory:write',
			'production:read',
			'production:write',
			'report:read',
			'audit:read',
		]),
	},
	{
		code: 'manager',
		name: 'Manager',
		isSystem: 1,
		permissions: JSON.stringify([
			'location:read',
			'iam:read',
			'uom:read',
			'material:read',
			'material:write',
			'supplier:read',
			'supplier:write',
			'menu:read',
			'menu:write',
			'recipe:read',
			'recipe:write',
			'payment-method:read',
			'pos:read',
			'pos:write',
			'pos:void',
			'inventory:read',
			'inventory:write',
			'production:read',
			'production:write',
			'report:read',
		]),
	},
	{
		code: 'cashier',
		name: 'Cashier',
		isSystem: 1,
		permissions: JSON.stringify([
			'menu:read',
			'pos:read',
			'pos:write',
			'payment-method:read',
			'inventory:read',
		]),
	},
	{
		code: 'warehouse_staff',
		name: 'Warehouse Staff',
		isSystem: 1,
		permissions: JSON.stringify([
			'material:read',
			'supplier:read',
			'inventory:read',
			'inventory:write',
			'production:read',
			'production:write',
		]),
	},
]

export async function seedRoles(sql: Sql): Promise<RoleIds> {
	console.log('  → Seeding roles...')
	const rows = await sql`
		INSERT INTO roles (code, name, is_system, permissions)
		VALUES ${sql(ROLES.map((r) => [r.code, r.name, r.isSystem, r.permissions]))}
		RETURNING id, code
	`

	return {
		owner: rows.find((r) => r.code === 'owner')!.id as number,
		manager: rows.find((r) => r.code === 'manager')!.id as number,
		cashier: rows.find((r) => r.code === 'cashier')!.id as number,
		warehouseStaff: rows.find((r) => r.code === 'warehouse_staff')!.id as number,
	}
}

// ─── Users ───

const PASSWORD = 'password123'

async function hashPassword(password: string): Promise<string> {
	return Bun.password.hash(password, { algorithm: 'bcrypt', cost: 12 })
}

export async function seedUsers(sql: Sql): Promise<UserIds> {
	console.log('  → Seeding users...')
	const hash = await hashPassword(PASSWORD)

	const USERS = [
		{ username: 'owner', email: 'owner@kedaikopi.id', name: 'Budi Santoso' },
		{ username: 'manager', email: 'manager@kedaikopi.id', name: 'Siti Rahayu' },
		{ username: 'cashier', email: 'cashier@kedaikopi.id', name: 'Andi Pratama' },
		{ username: 'warehouse', email: 'warehouse@kedaikopi.id', name: 'Dian Kusuma' },
	]

	const rows = await sql`
		INSERT INTO users (username, email, password_hash, name, is_active)
		VALUES ${sql(USERS.map((u) => [u.username, u.email, hash, u.name, 1]))}
		RETURNING id, username
	`

	return {
		owner: rows.find((r) => r.username === 'owner')!.id as number,
		manager: rows.find((r) => r.username === 'manager')!.id as number,
		cashier: rows.find((r) => r.username === 'cashier')!.id as number,
		warehouseStaff: rows.find((r) => r.username === 'warehouse')!.id as number,
	}
}

// ─── Assignments ───

export async function seedAssignments(
	sql: Sql,
	userIds: UserIds,
	roleIds: RoleIds,
	locationIds: LocationIds,
): Promise<void> {
	console.log('  → Seeding user assignments...')

	// Owner → global (locationId = null)
	// Manager → store
	// Cashier → store
	// Warehouse staff → warehouse
	await sql`
		INSERT INTO user_assignments (user_id, role_id, location_id)
		VALUES
			(${userIds.owner}, ${roleIds.owner}, NULL),
			(${userIds.manager}, ${roleIds.manager}, ${locationIds.store}),
			(${userIds.cashier}, ${roleIds.cashier}, ${locationIds.store}),
			(${userIds.warehouseStaff}, ${roleIds.warehouseStaff}, ${locationIds.warehouse})
	`
}
