import z from 'zod'

import {
  zDecimal,
  zId,
  zMetadataDto,
  zQuerySearch,
  zRecordIdDto,
  zStr,
} from '@/lib/zod'

export const WorkOrderStatusDto = z.enum(['draft', 'in_progress', 'completed', 'cancelled'])
export type WorkOrderStatusDto = z.infer<typeof WorkOrderStatusDto>

/* --------------------------------- ENTITY --------------------------------- */

export const WorkOrderDto = z.object({
  ...zRecordIdDto.shape,
  recipeId: zId,
  locationId: zId,
  status: WorkOrderStatusDto,

  expectedQty: zDecimal,
  actualQty: zDecimal,

  note: z.string().nullable(),
  totalCost: zDecimal,

  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),

  ...zMetadataDto.shape,
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
  q: zQuerySearch,
  locationId: zId.optional(),
  status: WorkOrderStatusDto.optional(),
})

export type WorkOrderFilterDto = z.infer<typeof WorkOrderFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const WorkOrderCreateDto = z.object({
  recipeId: zId,
  locationId: zId,
  expectedQty: zDecimal,
  note: zStr.optional(),
})

export type WorkOrderCreateDto = z.infer<typeof WorkOrderCreateDto>

export const WorkOrderUpdateDto = z.object({
  id: zId,
  expectedQty: zDecimal.optional(),
  status: WorkOrderStatusDto.optional(),
  note: zStr.optional(),
})

export type WorkOrderUpdateDto = z.infer<typeof WorkOrderUpdateDto>

export const WorkOrderCompleteDto = z.object({ id: zId, actualQty: zDecimal, note: zStr.optional() })

export type WorkOrderCompleteDto = z.infer<typeof WorkOrderCompleteDto>
