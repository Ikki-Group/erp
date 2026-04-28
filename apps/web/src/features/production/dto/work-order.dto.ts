import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

export const WorkOrderStatusDto = z.enum(['draft', 'in_progress', 'completed', 'cancelled'])
export type WorkOrderStatusDto = z.infer<typeof WorkOrderStatusDto>

/* --------------------------------- ENTITY --------------------------------- */

export const WorkOrderDto = z.object({
	...zc.RecordId.shape,
	recipeId: zp.id,
	locationId: zp.id,
	status: WorkOrderStatusDto,

	expectedQty: zp.decimal,
	actualQty: zp.decimal,

	note: z.string().nullable(),
	totalCost: zp.decimal,

	startedAt: z.coerce.date().nullable(),
	completedAt: z.coerce.date().nullable(),

	...zc.AuditFull.shape,
})

export type WorkOrderDto = z.infer<typeof WorkOrderDto>

/* ---------------------------------- READ ---------------------------------- */

export const WorkOrderSelectDto = WorkOrderDto.extend({
	recipeName: z.string().optional(),
	productName: z.string().optional(),
	locationName: z.string().optional(),
})

export type WorkOrderSelectDto = z.infer<typeof WorkOrderSelectDto>

export const WorkOrderFilterDto = z.object({
	q: zq.search,
	locationId: zp.id.optional(),
	status: WorkOrderStatusDto.optional(),
})

export type WorkOrderFilterDto = z.infer<typeof WorkOrderFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const WorkOrderCreateDto = z.object({
	recipeId: zp.id,
	locationId: zp.id,
	expectedQty: zp.decimal,
	note: zp.str.optional(),
})

export type WorkOrderCreateDto = z.infer<typeof WorkOrderCreateDto>

export const WorkOrderUpdateDto = z.object({
	id: zp.id,
	expectedQty: zp.decimal.optional(),
	status: WorkOrderStatusDto.optional(),
	note: zp.str.optional(),
})

export type WorkOrderUpdateDto = z.infer<typeof WorkOrderUpdateDto>

export const WorkOrderCompleteDto = z.object({
	id: zp.id,
	actualQty: zp.decimal,
	note: zp.str.optional(),
})

export type WorkOrderCompleteDto = z.infer<typeof WorkOrderCompleteDto>
