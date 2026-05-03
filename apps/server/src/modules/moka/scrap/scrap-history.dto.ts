import { z } from 'zod'

import {
	MokaProvider,
	MokaScrapStatusEnum,
	MokaScrapType,
	MokaSyncTriggerMode,
} from '../shared.dto'
import { zc, zq } from '@/lib/validation'

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
	rawPath: z.string().nullable(),
	errorMessage: z.string().nullable(),
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
