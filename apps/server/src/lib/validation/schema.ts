import z from 'zod'

import { zPrimitive } from './primitive'

const metadata = z.object({
  createdBy: zPrimitive.objId,
  updatedBy: zPrimitive.objId,
  createdAt: zPrimitive.date,
  updatedAt: zPrimitive.date,
  syncAt: zPrimitive.date.optional(),
})

const recordId = z.object({
  id: zPrimitive.num,
})

export const zSchema = {
  metadata,
  recordId,
}
