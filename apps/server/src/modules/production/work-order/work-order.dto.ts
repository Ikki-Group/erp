import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const WorkOrderStatusEnum = z.enum(['draft', 'in_progress', 'completed', 'cancelled'])
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusEnum>

/* --------------------------------- ENTITY --------------------------------- */

export const WorkOrderDto = z.object({
	...zc.RecordId.shape,
	recipeId: zp.id,
	locationId: zp.id,
	status: WorkOrderStatusEnum,
	expectedQty: zp.decimal,
	actualQty: zp.decimal,
	note: zp.strNullable,
	totalCost: zp.decimal,
	startedAt: zp.date.nullable(),
	completedAt: zp.date.nullable(),
	...zc.AuditBasic.shape,
})

export type WorkOrderDto = z.infer<typeof WorkOrderDto>

/* ---------------------------------- READ ---------------------------------- */

export const WorkOrderSelectDto = WorkOrderDto.extend({
	recipeName: zp.str.optional(),
	productName: zp.str.optional(),
	locationName: zp.str.optional(),
})

export type WorkOrderSelectDto = z.infer<typeof WorkOrderSelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const WorkOrderFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	locationId: zq.id.optional(),
	status: WorkOrderStatusEnum.optional(),
})

export type WorkOrderFilterDto = z.infer<typeof WorkOrderFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const WorkOrderCreateDto = z.object({
	recipeId: zp.id,
	locationId: zp.id,
	expectedQty: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0'),
	note: zc.strTrimNullable,
})

export type WorkOrderCreateDto = z.infer<typeof WorkOrderCreateDto>

export const WorkOrderUpdateDto = z.object({
	...zc.RecordId.shape,
	expectedQty: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0').optional(),
	status: WorkOrderStatusEnum.optional(),
	note: zc.strTrimNullable,
})

export type WorkOrderUpdateDto = z.infer<typeof WorkOrderUpdateDto>

export const WorkOrderCompleteDto = z.object({
	...zc.RecordId.shape,
	actualQty: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0'),
	note: zc.strTrimNullable,
})

export type WorkOrderCompleteDto = z.infer<typeof WorkOrderCompleteDto>
