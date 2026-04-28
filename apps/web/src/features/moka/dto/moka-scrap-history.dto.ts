import { z } from 'zod'

import { zp, zc, zq } from '@/lib/validation'

export const MokaScrapType = z.enum(['sales', 'product', 'category'])
export type MokaScrapType = z.infer<typeof MokaScrapType>

export const MokaScrapStatus = z.enum(['pending', 'processing', 'completed', 'failed'])
export type MokaScrapStatus = z.infer<typeof MokaScrapStatus>

export const MokaScrapHistoryDto = z.object({
	...zc.RecordId.shape,
	mokaConfigurationId: zp.id,
	type: MokaScrapType,
	status: MokaScrapStatus,
	dateFrom: zp.date,
	dateTo: zp.date,
	rawPath: z.string().nullable(),
	errorMessage: z.string().nullable(),
	metadata: z.record(z.string(), z.any()).nullable(),
	...zc.AuditFull.shape,
})
export type MokaScrapHistoryDto = z.infer<typeof MokaScrapHistoryDto>

export const MokaScrapHistoryFilterDto = z.object({
	mokaConfigurationId: zq.id.optional(),
	type: MokaScrapType.optional(),
	status: MokaScrapStatus.optional(),
})
export type MokaScrapHistoryFilterDto = z.infer<typeof MokaScrapHistoryFilterDto>
