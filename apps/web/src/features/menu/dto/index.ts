import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Enums ───

export const MenuItemStatusEnum = z.enum(['active', 'inactive'])
export type MenuItemStatusEnum = z.infer<typeof MenuItemStatusEnum>

export const SelectionTypeEnum = z.enum(['single', 'multiple'])
export type SelectionTypeEnum = z.infer<typeof SelectionTypeEnum>

export const MENU_ITEM_STATUS_OPTIONS = [
	{ label: 'Active', value: 'active' },
	{ label: 'Inactive', value: 'inactive' },
] as const

export const SELECTION_TYPE_OPTIONS = [
	{ label: 'Single', value: 'single' },
	{ label: 'Multiple', value: 'multiple' },
] as const

// ─── Menu Category ───

export const MenuCategoryDto = z.object({
	id: zp.id,
	locationId: zp.id,
	name: zp.str,
	parentId: z.number().int().positive().nullable(),
	sortOrder: z.number().int(),
	...zc.AuditBasic.shape,
})
export type MenuCategoryDto = z.infer<typeof MenuCategoryDto>

export const MenuCategoryFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	q: zq.search,
})
export type MenuCategoryFilterDto = z.infer<typeof MenuCategoryFilterDto>

export const MenuCategoryCreateDto = z.object({
	locationId: zp.id,
	name: zc.strTrim.min(2).max(100),
	parentId: z.number().int().positive().nullable().optional(),
	sortOrder: z.number().int().min(0).default(0),
})
export type MenuCategoryCreateDto = z.infer<typeof MenuCategoryCreateDto>

export const MenuCategoryUpdateDto = z.object({
	id: zp.id,
	name: zc.strTrim.min(2).max(100),
	parentId: z.number().int().positive().nullable().optional(),
	sortOrder: z.number().int().min(0).default(0),
})
export type MenuCategoryUpdateDto = z.infer<typeof MenuCategoryUpdateDto>

// ─── Menu Item ───

export const MenuItemDto = z.object({
	id: zp.id,
	locationId: zp.id,
	sku: zp.str,
	name: zp.str,
	categoryId: z.number().int().positive().nullable(),
	basePrice: zp.str,
	status: MenuItemStatusEnum,
	imageUrl: z.string().nullable(),
	...zc.AuditBasic.shape,
})
export type MenuItemDto = z.infer<typeof MenuItemDto>

export const MenuItemFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	categoryId: z.coerce.number().int().positive().optional(),
	status: MenuItemStatusEnum.optional(),
	q: zq.search,
})
export type MenuItemFilterDto = z.infer<typeof MenuItemFilterDto>

export const MenuItemCreateDto = z.object({
	locationId: zp.id,
	sku: zc.strTrim.min(1).max(100),
	name: zc.strTrim.min(2).max(255),
	categoryId: z.number().int().positive().nullable().optional(),
	basePrice: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a valid price'),
	status: MenuItemStatusEnum.default('active'),
	imageUrl: z.string().max(500).nullable().optional(),
})
export type MenuItemCreateDto = z.infer<typeof MenuItemCreateDto>

export const MenuItemUpdateDto = z.object({
	id: zp.id,
	sku: zc.strTrim.min(1).max(100),
	name: zc.strTrim.min(2).max(255),
	categoryId: z.number().int().positive().nullable().optional(),
	basePrice: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a valid price'),
	status: MenuItemStatusEnum.default('active'),
	imageUrl: z.string().max(500).nullable().optional(),
})
export type MenuItemUpdateDto = z.infer<typeof MenuItemUpdateDto>

// ─── Menu Item Detail (composed) ───

export const MenuCategoryRefDto = z.object({
	id: zp.id,
	name: zp.str,
})
export type MenuCategoryRefDto = z.infer<typeof MenuCategoryRefDto>

// ─── Modifier Option ───

export const ModifierOptionDto = z.object({
	id: zp.id,
	groupId: zp.id,
	name: zp.str,
	priceAdjustment: zp.str,
	isDefault: z.number().int(),
	sortOrder: z.number().int(),
	isActive: z.number().int(),
})
export type ModifierOptionDto = z.infer<typeof ModifierOptionDto>

export const ModifierOptionInputDto = z.object({
	name: zc.strTrim.min(1).max(100),
	priceAdjustment: z
		.string()
		.regex(/^-?\d+(\.\d+)?$/u, 'Must be a valid number')
		.default('0'),
	isDefault: z.number().int().min(0).max(1).default(0),
	sortOrder: z.number().int().min(0).default(0),
	isActive: z.number().int().min(0).max(1).default(1),
})
export type ModifierOptionInputDto = z.infer<typeof ModifierOptionInputDto>

// ─── Modifier Group ───

export const ModifierGroupDto = z.object({
	id: zp.id,
	locationId: zp.id,
	name: zp.str,
	selectionType: SelectionTypeEnum,
	isRequired: z.number().int(),
	minSelect: z.number().int(),
	maxSelect: z.number().int().nullable(),
	...zc.AuditBasic.shape,
})
export type ModifierGroupDto = z.infer<typeof ModifierGroupDto>

export const ModifierGroupWithOptionsDto = z.object({
	...ModifierGroupDto.shape,
	options: z.array(ModifierOptionDto),
})
export type ModifierGroupWithOptionsDto = z.infer<typeof ModifierGroupWithOptionsDto>

export const ModifierGroupFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	q: zq.search,
})
export type ModifierGroupFilterDto = z.infer<typeof ModifierGroupFilterDto>

export const ModifierGroupCreateDto = z.object({
	locationId: zp.id,
	name: zc.strTrim.min(2).max(100),
	selectionType: SelectionTypeEnum.default('single'),
	isRequired: z.number().int().min(0).max(1).default(0),
	minSelect: z.number().int().min(0).default(0),
	maxSelect: z.number().int().positive().nullable().optional(),
	options: z.array(ModifierOptionInputDto).min(1),
})
export type ModifierGroupCreateDto = z.infer<typeof ModifierGroupCreateDto>

export const ModifierGroupUpdateDto = z.object({
	id: zp.id,
	name: zc.strTrim.min(2).max(100),
	selectionType: SelectionTypeEnum.default('single'),
	isRequired: z.number().int().min(0).max(1).default(0),
	minSelect: z.number().int().min(0).default(0),
	maxSelect: z.number().int().positive().nullable().optional(),
	options: z.array(ModifierOptionInputDto).min(1),
})
export type ModifierGroupUpdateDto = z.infer<typeof ModifierGroupUpdateDto>

// ─── Menu Item Detail (composed with modifiers) ───

export const MenuItemDetailDto = z.object({
	...MenuItemDto.shape,
	category: MenuCategoryRefDto.nullable(),
	modifierGroups: z.array(ModifierGroupWithOptionsDto),
})
export type MenuItemDetailDto = z.infer<typeof MenuItemDetailDto>

// ─── Item-Modifier Assignment ───

export const ModifierGroupAssignmentInput = z.object({
	groupId: zp.id,
	sortOrder: z.number().int().min(0).default(0),
})
export type ModifierGroupAssignmentInput = z.infer<typeof ModifierGroupAssignmentInput>

export const MenuItemModifierSyncDto = z.object({
	menuItemId: zp.id,
	groups: z.array(ModifierGroupAssignmentInput),
})
export type MenuItemModifierSyncDto = z.infer<typeof MenuItemModifierSyncDto>
