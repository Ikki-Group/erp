import z from 'zod'

import { zDate, zId } from './primitive'

export const zMetadataDto = z.object({
  createdAt: zDate,
  updatedAt: zDate,
  createdBy: zId,
  updatedBy: zId,
  syncAt: zDate.optional().nullable(),
})

export const zRecordIdDto = z.object({ id: zId })
