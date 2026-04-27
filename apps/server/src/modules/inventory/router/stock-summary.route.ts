import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zc, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import {
	GenerateSummaryDto,
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
} from '../dto'
import type { InventoryServiceModule } from '../service'

export function initStockSummaryRoute(s: InventoryServiceModule) {
	return (
		new Elysia({ prefix: '/summary' })
			.use(authPluginMacro)

			/* ─────── Daily summaries by location (date range, paginated) ─────── */
			.get(
				'/by-location',
				async function byLocation({ query }) {
					const result = await s.summary.handleByLocation(query)
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
					const result = await s.summary.handleLedger(query)
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
					const result = await s.summary.handleGenerate(body, auth.userId)
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
					await s.summary.handleRemove(query.id, auth.userId)
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
