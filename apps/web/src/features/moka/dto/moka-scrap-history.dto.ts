import { z } from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* ---------------------------------- ENUMS ---------------------------------- */

export const MokaScrapType = z.enum(['sales', 'product', 'category'])
export type MokaScrapType = z.infer<typeof MokaScrapType>

export const MokaProvider = z.enum(['moka'])
export type MokaProvider = z.infer<typeof MokaProvider>

export const MokaSyncTriggerMode = z.enum(['manual', 'cron', 'upload', 'machine_fetch'])
export type MokaSyncTriggerMode = z.infer<typeof MokaSyncTriggerMode>

export const MokaScrapStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed'])
export type MokaScrapStatus = z.infer<typeof MokaScrapStatusEnum>

/* ---------------------------------- ENTITY ---------------------------------- */

export const MokaScrapHistoryDto = z.object({
	...zc.RecordId.shape,
	mokaConfigurationId: z.number(),
	provider: MokaProvider,
	type: MokaScrapType,
	triggerMode: MokaSyncTriggerMode,
	status: MokaScrapStatusEnum,
	dateFrom: z.date(),
	dateTo: z.date(),
	startedAt: z.date().nullable(),
	finishedAt: z.date().nullable(),
	recordsCount: z.number(),
	rawPath: zp.strNullable,
	errorMessage: zp.strNullable,
	metadata: z.record(z.string(), z.any()).nullable(),
	...zc.AuditBasic.shape,
})
export type MokaScrapHistoryDto = z.infer<typeof MokaScrapHistoryDto>

/* ---------------------------------- FILTER ---------------------------------- */

export const MokaScrapHistoryFilterDto = z.object({
	...zq.pagination.shape,
	mokaConfigurationId: zq.id.optional(),
	provider: MokaProvider.optional(),
	type: MokaScrapType.optional(),
	triggerMode: MokaSyncTriggerMode.optional(),
	status: MokaScrapStatusEnum.optional(),
})
export type MokaScrapHistoryFilterDto = z.infer<typeof MokaScrapHistoryFilterDto>
