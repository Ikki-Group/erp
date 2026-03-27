import z from 'zod'

import { zDate, zId } from './primitive'

export const zMetadataSchema = z.object({
  createdBy: zId,
  updatedBy: zId,
  createdAt: zDate,
  updatedAt: zDate,
  syncAt: zDate.optional().nullable(),
})

export const zRecordIdSchema = z.object({ id: zId })
