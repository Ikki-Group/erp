import z from 'zod'

import { zDate, zId } from './primitive'

export const zMetadataSchema = z.object({
  createdAt: zDate,
  updatedAt: zDate,
  createdBy: zId,
  updatedBy: zId,
  syncAt: zDate.optional().nullable(),
})

export const zRecordIdSchema = z.object({ id: zId })
