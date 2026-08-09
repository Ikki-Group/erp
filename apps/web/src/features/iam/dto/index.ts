import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Permission Groups ───

export const PERMISSION_GROUPS = [
	{
		module: 'company',
		label: 'Company',
		permissions: ['company:read', 'company:write'],
	},
	{
		module: 'location',
		label: 'Location',
		permissions: ['location:read', 'location:write'],
	},
	{
		module: 'iam',
		label: 'Users & Roles',
		permissions: ['iam:read', 'iam:write'],
	},
	{
		module: 'uom',
		label: 'Unit of Measure',
		permissions: ['uom:read', 'uom:write'],
	},
	{
		module: 'material',
		label: 'Material',
		permissions: ['material:read', 'material:write'],
	},
	{
		module: 'supplier',
		label: 'Supplier',
		permissions: ['supplier:read', 'supplier:write'],
	},
	{
		module: 'menu',
		label: 'Menu',
		permissions: ['menu:read', 'menu:write'],
	},
	{
		module: 'recipe',
		label: 'Recipe',
		permissions: ['recipe:read', 'recipe:write'],
	},
	{
		module: 'payment-method',
		label: 'Payment Method',
		permissions: ['payment-method:read', 'payment-method:write'],
	},
	{
		module: 'pos',
		label: 'Point of Sale',
		permissions: ['pos:read', 'pos:write', 'pos:void'],
	},
	{
		module: 'inventory',
		label: 'Inventory',
		permissions: ['inventory:read', 'inventory:write'],
	},
	{
		module: 'production',
		label: 'Production',
		permissions: ['production:read', 'production:write'],
	},
	{
		module: 'report',
		label: 'Report',
		permissions: ['report:read'],
	},
	{
		module: 'audit',
		label: 'Audit Log',
		permissions: ['audit:read'],
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
