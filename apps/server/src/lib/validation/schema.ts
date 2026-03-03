import z from 'zod'

import { zPrimitive } from './primitive'

const metadata = z.object({
  createdBy: zPrimitive.id,
  updatedBy: zPrimitive.id,
  createdAt: zPrimitive.date,
  updatedAt: zPrimitive.date,
  syncAt: zPrimitive.date.optional(),
})

const recordId = z.object({
  id: zPrimitive.id,
})

export const zSchema = {
  metadata,
  recordId,
}
