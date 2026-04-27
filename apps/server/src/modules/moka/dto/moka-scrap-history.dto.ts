import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const MokaScrapType = z.enum(['sales', 'product', 'category'])
export type MokaScrapType = z.infer<typeof MokaScrapType>

export const MokaScrapStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed'])
export type MokaScrapStatus = z.infer<typeof MokaScrapStatusEnum>

/* ---------------------------------- ENTITY ---------------------------------- */

export const MokaScrapHistoryDto = z.object({
	...zc.RecordId.shape,
	mokaConfigurationId: zp.id,
	type: MokaScrapType,
	status: MokaScrapStatusEnum,
	dateFrom: zp.date,
	dateTo: zp.date,
	rawPath: zp.str.nullable(),
	errorMessage: zp.str.nullable(),
	metadata: z.record(z.string(), z.any()).nullable(),
	...zc.AuditBasic.shape,
})
export type MokaScrapHistoryDto = z.infer<typeof MokaScrapHistoryDto>

/* ---------------------------------- FILTER ---------------------------------- */

export const MokaScrapHistoryFilterDto = z.object({
	...zq.pagination.shape,
	mokaConfigurationId: zq.id.optional(),
	type: MokaScrapType.optional(),
	status: MokaScrapStatusEnum.optional(),
})
export type MokaScrapHistoryFilterDto = z.infer<typeof MokaScrapHistoryFilterDto>
