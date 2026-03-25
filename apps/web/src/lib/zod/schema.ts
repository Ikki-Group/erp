import z from 'zod'

import { zPrimitive } from './primitive'

const metadata = z.object({
  createdAt: zPrimitive.date,
  updatedAt: zPrimitive.date,
  createdBy: zPrimitive.id,
  updatedBy: zPrimitive.id,
  syncAt: zPrimitive.date.optional().nullable(),
})

const recordId = z.object({ id: zPrimitive.id })

export const zSchema = { metadata, recordId }
