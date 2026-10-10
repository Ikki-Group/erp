import type { Permission } from '@ikki/contract/permissions'

export {
	AssignmentCreateDto,
	AssignmentDto,
	AssignmentFilterDto,
	AssignmentRemoveDto,
} from '@ikki/contract/iam/assignment'
export {
	AssignmentWithRelationsDto,
	ComposedUserFilterDto as UserFilterDto,
	LocationStaffListItemDto,
	UserDetailDto,
	UserListItemDto,
} from '@ikki/contract/iam/composed'
export { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '@ikki/contract/iam/role'
export {
	UserCreateDto,
	UserDto,
	UserResetPasswordDto,
	UserUpdateDto,
} from '@ikki/contract/iam/user'
export type { Permission } from '@ikki/contract/permissions'

// ─── Permission Groups ───

/**
 * UI grouping of the server's permission vocabulary (`@ikki/contract/permissions`).
 * `satisfies` keeps every entry a real server permission, so the role form can't
 * offer a permission the server would reject. `auth.*` utility permissions are
 * granted implicitly and deliberately not listed.
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
		module: 'location-staff',
		label: 'Location Staff',
		permissions: ['location-staff.read'],
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
] as const satisfies ReadonlyArray<{
	module: string
	label: string
	permissions: readonly Permission[]
}>
