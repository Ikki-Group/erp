import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const TableStatusEnum = z.enum(['available', 'occupied', 'reserved'])
export type TableStatusEnum = z.infer<typeof TableStatusEnum>

// ─── Mutation Base (internal, not exported) ───

const TableMutationDto = z.object({
	locationId: zp.id,
	number: zc.strTrim.max(50),
	capacity: z.coerce.number().int().positive().optional().default(4),
	isActive: zp.bool.optional().default(true),
})

// ─── Response ───

export const TableDto = z.object({
	id: zp.id,
	locationId: zp.id,
	number: zp.str,
	capacity: zp.num,
	status: TableStatusEnum,
	isActive: zp.bool,
})
export type TableDto = z.infer<typeof TableDto>

// ─── Filter ───

export const TableFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	status: TableStatusEnum.optional(),
	q: zq.search,
})
export type TableFilterDto = z.infer<typeof TableFilterDto>

// ─── Create / Update ───

export const TableCreateDto = TableMutationDto
export type TableCreateDto = z.infer<typeof TableCreateDto>

export const TableUpdateDto = z.object({
	id: zp.id,
	...TableMutationDto.shape,
})
export type TableUpdateDto = z.infer<typeof TableUpdateDto>
