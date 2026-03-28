import z from 'zod'

import { zDate, zId } from './primitive'

export const zMetadataDto = z.object({
  createdBy: zId,
  updatedBy: zId,
  createdAt: zDate,
  updatedAt: zDate,
  deletedAt: zDate.optional().nullable(),
  deletedBy: zId.optional().nullable(),
  syncAt: zDate.optional().nullable(),
})

export const zRecordIdDto = z.object({ id: zId })
