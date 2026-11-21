import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const MenuItemStatusEnum = z.enum(['active', 'inactive'])
export type MenuItemStatusEnum = z.infer<typeof MenuItemStatusEnum>

// ─── Response ───

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

// ─── Filter ───

export const MenuItemFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	categoryId: z.coerce.number().int().positive().optional(),
	status: MenuItemStatusEnum.optional(),
	q: zq.search,
})
export type MenuItemFilterDto = z.infer<typeof MenuItemFilterDto>

// ─── Mutation Base ───

const MenuItemMutationDto = z.object({
	locationId: zp.id,
	sku: zc.strTrim.min(1).max(100),
	name: zc.strTrim.min(2).max(255),
	categoryId: z.number().int().positive().nullable().optional(),
	basePrice: z.string().regex(/^\d+(\.\d+)?$/u),
	status: MenuItemStatusEnum.default('active'),
	imageUrl: z.string().max(500).nullable().optional(),
})

// ─── Create / Update ───

export const MenuItemCreateDto = MenuItemMutationDto
export type MenuItemCreateDto = z.infer<typeof MenuItemCreateDto>

export const MenuItemUpdateDto = z.object({
	id: zp.id,
	...MenuItemMutationDto.omit({ locationId: true }).shape,
})
export type MenuItemUpdateDto = z.infer<typeof MenuItemUpdateDto>
