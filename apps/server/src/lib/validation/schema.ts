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

/**
 * Common Record Schemas
 */
const recordId = z.object({
  id: zPrimitive.num,
})

export const zSchema = {
  meta,
  recordId,
}
