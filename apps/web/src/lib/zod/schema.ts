import z from 'zod'

import { zPrimitive } from './primitive'

const meta = z.object({
  createdAt: zPrimitive.date,
  updatedAt: zPrimitive.date,
  createdBy: zPrimitive.id,
  updatedBy: zPrimitive.id,
  syncAt: zPrimitive.date.optional().nullable(),
})

const recordId = z.object({
  id: zPrimitive.id,
})

export const zSchema = {
  meta,
  metadata: meta,
  recordId,
}
