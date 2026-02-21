import z from 'zod'

import { zPrimitive } from './primitive'

/**
 * Domain / Database Schemas
 * Reusable schemas for DB entity common fields
 */

const meta = z.object({
  createdAt: zPrimitive.date,
  updatedAt: zPrimitive.date,
  createdBy: zPrimitive.num,
  updatedBy: zPrimitive.num,
})

export const zSchema = {
  meta,
}
