import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const SelectionTypeEnum = z.enum(['single', 'multiple'])
export type SelectionTypeEnum = z.infer<typeof SelectionTypeEnum>

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
		.regex(/^-?\d+(\.\d+)?$/u)
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

// ─── Filter ───

export const ModifierGroupFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	q: zq.search,
})
export type ModifierGroupFilterDto = z.infer<typeof ModifierGroupFilterDto>

// ─── Mutation Base ───

const ModifierGroupMutationDto = z.object({
	locationId: zp.id,
	name: zc.strTrim.min(2).max(100),
	selectionType: SelectionTypeEnum.default('single'),
	isRequired: z.number().int().min(0).max(1).default(0),
	minSelect: z.number().int().min(0).default(0),
	maxSelect: z.number().int().positive().nullable().optional(),
	options: z.array(ModifierOptionInputDto).min(1),
})

// ─── Create / Update ───

export const ModifierGroupCreateDto = ModifierGroupMutationDto
export type ModifierGroupCreateDto = z.infer<typeof ModifierGroupCreateDto>

export const ModifierGroupUpdateDto = z.object({
	id: zp.id,
	...ModifierGroupMutationDto.omit({ locationId: true }).shape,
})
export type ModifierGroupUpdateDto = z.infer<typeof ModifierGroupUpdateDto>
