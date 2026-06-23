import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

/* ---------------------------------- ENUM ---------------------------------- */

export const WorkOrderStatusEnum = z.enum(['draft', 'in_progress', 'completed', 'cancelled'])
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusEnum>

/* --------------------------------- ENTITY --------------------------------- */

export const WorkOrderSchema = z.object({
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

export type WorkOrderSchema = z.infer<typeof WorkOrderSchema>

/* ---------------------------------- READ ---------------------------------- */

export const WorkOrderSelectSchema = z.object({
	...WorkOrderSchema.shape,
	recipeName: zp.str.optional(),
	productName: zp.str.optional(),
	locationName: zp.str.optional(),
})

export type WorkOrderSelectSchema = z.infer<typeof WorkOrderSelectSchema>

/* --------------------------------- FILTER --------------------------------- */

export const WorkOrderFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	locationId: zq.id.optional(),
	status: WorkOrderStatusEnum.optional(),
})

export type WorkOrderFilterSchema = z.infer<typeof WorkOrderFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const WorkOrderCreateSchema = z.object({
	recipeId: zp.id,
	locationId: zp.id,
	expectedQty: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0'),
	note: zc.strTrimNullable,
})

export type WorkOrderCreateSchema = z.infer<typeof WorkOrderCreateSchema>

export const WorkOrderUpdateSchema = z.object({
	...zc.RecordId.shape,
	expectedQty: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0').optional(),
	status: WorkOrderStatusEnum.optional(),
	note: zc.strTrimNullable,
})

export type WorkOrderUpdateSchema = z.infer<typeof WorkOrderUpdateSchema>

export const WorkOrderCompleteSchema = z.object({
	...zc.RecordId.shape,
	actualQty: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0'),
	note: zc.strTrimNullable,
})

export type WorkOrderCompleteSchema = z.infer<typeof WorkOrderCompleteSchema>
