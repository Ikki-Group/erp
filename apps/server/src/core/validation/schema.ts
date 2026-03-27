import z from 'zod'

import { zDate, zId } from './primitive'

export const zMetadataDto = z.object({
  createdBy: zId,
  updatedBy: zId,
  createdAt: zDate,
  updatedAt: zDate,
  syncAt: zDate.optional().nullable(),
})

export const zRecordIdDto = z.object({ id: zId })
