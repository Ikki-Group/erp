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
	return (
		new Elysia({ prefix: '/summary' })
			.use(authPluginMacro)

			/* ─────── Daily summaries by location (date range, paginated) ─────── */
			.get(
				'/by-location',
				async function byLocation(context) {
					const result = await s.handleByLocation(context.query)
					return res.paginated(result)
				},
				{
					query: StockSummaryFilterDto,
					response: createPaginatedResponseDto(StockSummarySelectDto),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)

			/* ─────── Stock Ledger Aggregation (date range, paginated) ─────── */
			.get(
				'/ledger',
				async function ledger(context) {
					const result = await s.handleLedger(context.query)
					return res.paginated(result)
				},
				{
					query: StockLedgerFilterDto,
					response: createPaginatedResponseDto(StockLedgerSelectDto),
					auth: true,
					detail: { tags: ['Inventory Ledger'] },
				},
			)

			/* ─────── Generate/regenerate daily summary ─────── */
			.post(
				'/generate',
				async function generate(context) {
					const result = await s.handleGenerate(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: GenerateSummaryDto,
					response: createSuccessResponseDto(z.object({ generatedCount: z.number() })),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)

			/* ─────── Soft delete summary ─────── */
			.post(
				'/remove',
				async function remove(context) {
					await s.handleRemove(context.query.id, context.auth.userId)
					return res.ok({ id: context.query.id })
				},
				{
					query: zc.RecordId,
					response: createSuccessResponseDto(zc.RecordId),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)
	)
}
