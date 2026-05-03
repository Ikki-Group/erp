import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	GenerateSummaryDto,
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
} from './stock-summary.dto'
import type { StockSummaryService } from './stock-summary.service'
import { zc, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/lib/validation'

export function initStockSummaryRoute(s: StockSummaryService) {
	return (
		new Elysia({ prefix: '/summary' })
			.use(authPluginMacro)

			/* ─────── Daily summaries by location (date range, paginated) ─────── */
			.get(
				'/by-location',
				async function byLocation({ query }) {
					const result = await s.handleByLocation(query)
					return res.paginated(result)
				},
				{
					query: StockSummaryFilterDto,
					response: createPaginatedResponseSchema(StockSummarySelectDto),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)

			/* ─────── Stock Ledger Aggregation (date range, paginated) ─────── */
			.get(
				'/ledger',
				async function ledger({ query }) {
					const result = await s.handleLedger(query)
					return res.paginated(result)
				},
				{
					query: StockLedgerFilterDto,
					response: createPaginatedResponseSchema(StockLedgerSelectDto),
					auth: true,
					detail: { tags: ['Inventory Ledger'] },
				},
			)

			/* ─────── Generate/regenerate daily summary ─────── */
			.post(
				'/generate',
				async function generate({ body, auth }) {
					const result = await s.handleGenerate(body, auth.userId)
					return res.ok(result)
				},
				{
					body: GenerateSummaryDto,
					response: createSuccessResponseSchema(z.object({ generatedCount: z.number() })),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)

			/* ─────── Soft delete summary ─────── */
			.post(
				'/remove',
				async function remove({ query, auth }) {
					await s.handleRemove(query.id, auth.userId)
					return res.ok({ id: query.id })
				},
				{
					query: zc.RecordId,
					response: createSuccessResponseSchema(zc.RecordId),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)
	)
}
