import { z } from 'zod'

import { zDate, zId, zMetadataDto, zQueryId, zRecordIdDto } from '@/lib/zod'

export const MokaScrapType = z.enum(['sales', 'product', 'category'])
export type MokaScrapType = z.infer<typeof MokaScrapType>

export const MokaScrapStatus = z.enum(['pending', 'processing', 'completed', 'failed'])
export type MokaScrapStatus = z.infer<typeof MokaScrapStatus>

export const MokaScrapHistoryDto = z.object({
	...zRecordIdDto.shape,
	mokaConfigurationId: zId,
	type: MokaScrapType,
	status: MokaScrapStatus,
	dateFrom: zDate,
	dateTo: zDate,
	rawPath: z.string().nullable(),
	errorMessage: z.string().nullable(),
	metadata: z.record(z.string(), z.any()).nullable(),
	...zMetadataDto.shape,
})
export type MokaScrapHistoryDto = z.infer<typeof MokaScrapHistoryDto>

export const MokaScrapHistoryFilterDto = z.object({
	mokaConfigurationId: zQueryId.optional(),
	type: MokaScrapType.optional(),
	status: MokaScrapStatus.optional(),
})
export type MokaScrapHistoryFilterDto = z.infer<typeof MokaScrapHistoryFilterDto>
