import { z } from 'zod'

import { zPrimitive, zSchema } from '@/core/validation'

export const MokaScrapType = z.enum(['sales', 'product', 'category'])
export type MokaScrapType = z.infer<typeof MokaScrapType>

export const MokaScrapStatus = z.enum(['pending', 'processing', 'completed', 'failed'])
export type MokaScrapStatus = z.infer<typeof MokaScrapStatus>

export const MokaScrapHistoryDto = z.object({
  ...zSchema.recordId.shape,
  mokaConfigurationId: zPrimitive.id,
  type: MokaScrapType,
  status: MokaScrapStatus,
  dateFrom: zPrimitive.date,
  dateTo: zPrimitive.date,
  rawPath: z.string().nullable(),
  errorMessage: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).nullable(),
  ...zSchema.metadata.shape,
})
export type MokaScrapHistoryDto = z.infer<typeof MokaScrapHistoryDto>

export const MokaScrapHistoryFilterDto = z.object({
  mokaConfigurationId: zPrimitive.id.optional(),
  type: MokaScrapType.optional(),
  status: MokaScrapStatus.optional(),
})
export type MokaScrapHistoryFilterDto = z.infer<typeof MokaScrapHistoryFilterDto>
