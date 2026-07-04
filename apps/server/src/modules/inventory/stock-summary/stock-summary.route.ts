import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import {
	GenerateSummaryDto,
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
} from './stock-summary.contract'
import type { StockSummaryService } from './stock-summary.service'

export function initStockSummaryRoute(s: StockSummaryService) {
	return new Elysia({ prefix: '/summary' })
		.use(authPluginMacro)
		.get(
			'/by-location',
			async ({ query }) => {
				const result = await s.handleByLocation(query)
				return res.paginated(result)
			},
			{
				query: StockSummaryFilterDto,
				response: createPaginatedResponseDto(StockSummarySelectDto),
				auth: true,
				detail: { tags: ['Inventory Summary'] },
			},
		)
		.get(
			'/ledger',
			async ({ query }) => {
				const result = await s.handleLedger(query)
				return res.paginated(result)
			},
			{
				query: StockLedgerFilterDto,
				response: createPaginatedResponseDto(StockLedgerSelectDto),
				auth: true,
				detail: { tags: ['Inventory Ledger'] },
			},
		)
		.post(
			'/generate',
			async ({ body, auth }) => {
				const result = await s.handleGenerate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: GenerateSummaryDto,
				response: createSuccessResponseDto(z.object({ generatedCount: z.number() })),
				auth: true,
				detail: { tags: ['Inventory Summary'] },
			},
		)
		.post(
			'/remove',
			async ({ query, auth }) => {
				const result = await s.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
				detail: { tags: ['Inventory Summary'] },
			},
		)
}
