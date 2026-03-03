import z from 'zod'

import { zPrimitive } from './primitive'

const meta = z.object({
  createdAt: zPrimitive.date,
  updatedAt: zPrimitive.date,
  createdBy: zPrimitive.str,
  updatedBy: zPrimitive.str,
})

const recordId = z.object({
  id: zPrimitive.str,
})

export const zSchema = {
  meta,
  metadata: meta,
  recordId,
}
