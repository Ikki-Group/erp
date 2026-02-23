import z from 'zod'

import { zPrimitive } from './primitive'

const meta = z.object({
  createdAt: zPrimitive.date,
  updatedAt: zPrimitive.date,
  createdBy: zPrimitive.num,
  updatedBy: zPrimitive.num,
})

const recordId = z.object({
  id: zPrimitive.num,
})

export const zSchema = {
  meta,
  recordId,
}
