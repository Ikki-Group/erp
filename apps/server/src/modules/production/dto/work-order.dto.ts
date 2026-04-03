import z from 'zod'

import {
  zId,
  zDecimal,
  zStr,
  zDate,
  zQuerySearch,
  zMetadataDto,
  zRecordIdDto,
} from '@/core/validation'

export const workOrderStatusSchema = z.enum([
  'draft',
  'in_progress',
  'completed',
  'cancelled',
])

export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>

/* --------------------------------- ENTITY --------------------------------- */

export const workOrderSchema = z.object({
  ...zRecordIdDto.shape,
  recipeId: zId,
  locationId: zId,
  status: workOrderStatusSchema,
  
  expectedQty: zDecimal,
  actualQty: zDecimal,
  
  note: z.string().nullable(),
  totalCost: zDecimal,
  
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  
  ...zMetadataDto.shape,
})

export type WorkOrderDto = z.infer<typeof workOrderSchema>

/* ---------------------------------- READ ---------------------------------- */

export const workOrderSelectSchema = workOrderSchema.extend({
  recipeName: z.string().optional(),
  productName: z.string().optional(),
  locationName: z.string().optional(),
})

export type WorkOrderSelectDto = z.infer<typeof workOrderSelectSchema>

export const workOrderFilterSchema = z.object({
  search: zQuerySearch,
  locationId: zId.optional(),
  status: workOrderStatusSchema.optional(),
})

export type WorkOrderFilterDto = z.infer<typeof workOrderFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const workOrderCreateSchema = z.object({
  recipeId: zId,
  locationId: zId,
  expectedQty: zDecimal,
  note: zStr.optional(),
})

export type WorkOrderCreateDto = z.infer<typeof workOrderCreateSchema>

export const workOrderUpdateSchema = z.object({
  id: zId,
  expectedQty: zDecimal.optional(),
  status: workOrderStatusSchema.optional(),
  note: zStr.optional(),
})

export type WorkOrderUpdateDto = z.infer<typeof workOrderUpdateSchema>

export const workOrderCompleteSchema = z.object({
  id: zId,
  actualQty: zDecimal,
  note: zStr.optional(),
})

export type WorkOrderCompleteDto = z.infer<typeof workOrderCompleteSchema>
