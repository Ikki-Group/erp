import z from 'zod'

import { zPrimitive } from '@/lib/validation'

export const MaterialLocationDto = z.object({
  id: zPrimitive.objId,
  materialId: zPrimitive.objId,
  locationId: zPrimitive.objId,
  assignedAt: zPrimitive.date,
  assignedBy: zPrimitive.objId,
})

export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialLocationAssignmentDto = z.object({
  materialId: zPrimitive.objId,
  locationId: zPrimitive.objId,
})

export type MaterialLocationAssignmentDto = z.infer<typeof MaterialLocationAssignmentDto>
