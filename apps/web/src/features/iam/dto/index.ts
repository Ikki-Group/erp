import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Permission Groups ───

/**
 * Mirrors the server's actual RBAC permission strings exactly — see the
 * `permission: '...'` literals on each route in `apps/server/src/modules/**\/*.route.ts`
 * and the seeded role permission lists in `apps/server/scripts/seeds/iam.ts`
 * (the source of truth for the full permission universe). These are dot-notation,
 * per-verb strings (`location.create`, `material.update`, `iam.delete`, ...),
 * NOT the `module:action` shape used by earlier web-only permission checks —
 * that shape never matched anything the server actually checks, so any
 * `PermissionGate`/role assignment built against it was silently inert for
 * every non-owner user. Keep this list in sync with the server's routes.
 */
export const PERMISSION_GROUPS = [
	{
		module: 'company',
		label: 'Company',
		permissions: ['company.read', 'company.update'],
	},
	{
		module: 'location',
		label: 'Location',
		permissions: ['location.read', 'location.create', 'location.update', 'location.delete'],
	},
	{
		module: 'iam',
		label: 'Users & Roles',
		permissions: ['iam.read', 'iam.create', 'iam.update', 'iam.delete'],
	},
	{
		module: 'uom',
		label: 'Unit of Measure',
		permissions: ['uom.read', 'uom.create', 'uom.update', 'uom.delete'],
	},
	{
		module: 'material',
		label: 'Material',
		permissions: ['material.read', 'material.create', 'material.update', 'material.delete'],
	},
	{
		module: 'supplier',
		label: 'Supplier',
		permissions: ['supplier.read', 'supplier.create', 'supplier.update', 'supplier.delete'],
	},
	{
		module: 'menu',
		label: 'Menu',
		permissions: [
			'category.read',
			'category.create',
			'category.update',
			'category.delete',
			'item.read',
			'item.create',
			'item.update',
			'item.delete',
			'modifier.read',
			'modifier.create',
			'modifier.update',
			'modifier.delete',
		],
	},
	{
		module: 'recipe',
		label: 'Recipe',
		permissions: ['recipe.read', 'recipe.create', 'recipe.update', 'recipe.delete'],
	},
	{
		module: 'payment-method',
		label: 'Payment Method',
		permissions: [
			'payment-method.read',
			'payment-method.create',
			'payment-method.update',
			'payment-method.delete',
		],
	},
	{
		module: 'pos',
		label: 'Point of Sale',
		permissions: [
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
		],
	},
	{
		module: 'inventory',
		label: 'Inventory',
		permissions: [
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
		],
	},
	{
		module: 'production',
		label: 'Production',
		permissions: [
			'production.read',
			'production.create',
			'production.update',
			'production.delete',
			'production.confirm',
		],
	},
	{
		module: 'audit',
		label: 'Audit Log',
		permissions: ['audit.read'],
	},
] as const

// ─── Role ───

export const RoleDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	isSystem: zp.bool,
	permissions: z.array(zp.str),
	...zc.AuditBasic.shape,
})
export type RoleDto = z.infer<typeof RoleDto>

export const RoleFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type RoleFilterDto = z.infer<typeof RoleFilterDto>

export const RoleCreateDto = z.object({
	code: zc.strTrim.min(2).max(50),
	name: zc.strTrim.min(2).max(255),
	permissions: z.array(z.string()).default([]),
})
export type RoleCreateDto = z.infer<typeof RoleCreateDto>

export const RoleUpdateDto = z.object({
	id: zp.id,
	code: zc.strTrim.min(2).max(50),
	name: zc.strTrim.min(2).max(255),
	permissions: z.array(z.string()).default([]),
})
export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>

// ─── User ───

export const UserDto = z.object({
	id: zp.id,
	username: zp.str,
	email: zp.str,
	name: zp.str,
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type UserDto = z.infer<typeof UserDto>

export const UserListItemDto = z.object({
	...UserDto.shape,
	roleNames: z.array(zp.str),
})
export type UserListItemDto = z.infer<typeof UserListItemDto>

export const AssignmentWithRelationsDto = z.object({
	id: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
	role: z.object({
		id: zp.id,
		code: zp.str,
		name: zp.str,
	}),
	location: z
		.object({
			id: zp.id,
			code: zp.str,
			name: zp.str,
		})
		.nullable(),
})
export type AssignmentWithRelationsDto = z.infer<typeof AssignmentWithRelationsDto>

export const UserDetailDto = z.object({
	...UserDto.shape,
	assignments: z.array(AssignmentWithRelationsDto),
})
export type UserDetailDto = z.infer<typeof UserDetailDto>

export const UserFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})
export type UserFilterDto = z.infer<typeof UserFilterDto>

export const UserCreateDto = z.object({
	username: zc.strTrim.min(3).max(100),
	email: z.string().email().max(255),
	name: zc.strTrim.min(1).max(255),
	password: z.string().min(8).max(100),
	isActive: z.boolean().default(true),
})
export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = z.object({
	id: zp.id,
	username: zc.strTrim.min(3).max(100),
	email: z.string().email().max(255),
	name: zc.strTrim.min(1).max(255),
	password: z.string().min(8).max(100).optional(),
	isActive: z.boolean().default(true),
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>

// ─── Assignment ───

export const AssignmentDto = z.object({
	id: zp.id,
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
})
export type AssignmentDto = z.infer<typeof AssignmentDto>

export const AssignmentFilterDto = z.object({
	...zq.pagination.shape,
	userId: z.coerce.number().int().positive(),
})
export type AssignmentFilterDto = z.infer<typeof AssignmentFilterDto>

export const AssignmentCreateDto = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
})
export type AssignmentCreateDto = z.infer<typeof AssignmentCreateDto>

export const AssignmentRemoveDto = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
})
export type AssignmentRemoveDto = z.infer<typeof AssignmentRemoveDto>
