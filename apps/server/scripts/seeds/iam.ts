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
		isSystem: true,
		permissions: JSON.stringify([
			'auth.me',
			'auth.logout',
			'company.read',
			'company.update',
			'location.read',
			'location.create',
			'location.update',
			'location.delete',
			'iam.read',
			'iam.create',
			'iam.update',
			'iam.delete',
			'uom.read',
			'uom.create',
			'uom.update',
			'uom.delete',
			'material.read',
			'material.create',
			'material.update',
			'material.delete',
			'supplier.read',
			'supplier.create',
			'supplier.update',
			'supplier.delete',
			'category.read',
			'item.read',
			'modifier.read',
			'category.create',
			'item.create',
			'modifier.create',
			'category.update',
			'item.update',
			'modifier.update',
			'category.delete',
			'item.delete',
			'modifier.delete',
			'recipe.read',
			'recipe.create',
			'recipe.update',
			'recipe.delete',
			'payment-method.read',
			'payment-method.create',
			'payment-method.update',
			'payment-method.delete',
			'order.read',
			'order.create',
			'order.update',
			'order.void',
			'payment.create',
			'shift.read',
			'shift.open',
			'shift.close',
			'shift.close-other',
			'discount.apply',
			'voucher.manage',
			'table.manage',
			'stock.read',
			'stock.adjust',
			'receiving.read',
			'receiving.create',
			'receiving.update',
			'receiving.confirm',
			'transfer.read',
			'transfer.create',
			'transfer.ship',
			'transfer.receive',
			'opname.read',
			'opname.create',
			'opname.update',
			'opname.complete',
			'production.read',
			'production.create',
			'production.update',
			'production.delete',
			'production.confirm',
			'audit.read',
		]),
	},
	{
		code: 'manager',
		name: 'Manager',
		isSystem: true,
		permissions: JSON.stringify([
			'auth.me',
			'auth.logout',
			'location.read',
			'iam.read',
			'uom.read',
			'material.read',
			'material.create',
			'material.update',
			'supplier.read',
			'supplier.create',
			'supplier.update',
			'category.read',
			'item.read',
			'modifier.read',
			'category.create',
			'item.create',
			'modifier.create',
			'category.update',
			'item.update',
			'modifier.update',
			'recipe.read',
			'recipe.create',
			'recipe.update',
			'payment-method.read',
			'order.read',
			'order.create',
			'order.update',
			'order.void',
			'payment.create',
			'shift.read',
			'shift.open',
			'shift.close',
			'shift.close-other',
			'discount.apply',
			'voucher.manage',
			'table.manage',
			'stock.read',
			'receiving.read',
			'receiving.create',
			'receiving.update',
			'receiving.confirm',
			'transfer.read',
			'transfer.create',
			'transfer.ship',
			'transfer.receive',
			'opname.read',
			'opname.create',
			'opname.update',
			'opname.complete',
			'production.read',
			'production.create',
			'production.update',
			'production.delete',
			'production.confirm',
		]),
	},
	{
		code: 'cashier',
		name: 'Cashier',
		isSystem: true,
		permissions: JSON.stringify([
			'auth.me',
			'auth.logout',
			'category.read',
			'item.read',
			'modifier.read',
			'payment-method.read',
			'order.read',
			'order.create',
			'order.update',
			'payment.create',
			'shift.read',
			'shift.open',
			'shift.close',
			'discount.apply',
			'table.manage',
			'stock.read',
		]),
	},
	{
		code: 'warehouse_staff',
		name: 'Warehouse Staff',
		isSystem: true,
		permissions: JSON.stringify([
			'auth.me',
			'auth.logout',
			'material.read',
			'supplier.read',
			'receiving.read',
			'receiving.create',
			'receiving.update',
			'receiving.confirm',
			'stock.read',
			'stock.adjust',
			'transfer.read',
			'transfer.create',
			'transfer.ship',
			'transfer.receive',
			'opname.read',
			'opname.create',
			'opname.update',
			'opname.complete',
			'production.read',
			'production.create',
			'production.update',
			'production.delete',
			'production.confirm',
		]),
	},
]

export async function seedRoles(sql: Sql): Promise<RoleIds> {
	console.log('  → Seeding roles...')
	const rows = await Promise.all(
		ROLES.map(async (r) => {
			const [row] = await sql`
				INSERT INTO roles (code, name, is_system, permissions)
				VALUES (${r.code}, ${r.name}, true, ${r.permissions})
				RETURNING id, code
			`
			return row!
		}),
	)

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

	const rows = await Promise.all(
		USERS.map(async (u) => {
			const [row] = await sql`
				INSERT INTO users (username, email, password_hash, name, is_active)
				VALUES (${u.username}, ${u.email}, ${hash}, ${u.name}, true)
				RETURNING id, username
			`
			return row!
		}),
	)

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
