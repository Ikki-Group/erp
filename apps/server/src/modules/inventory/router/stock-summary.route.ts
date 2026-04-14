import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	zPaginationDto,
	zRecordIdDto,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/core/validation'

import {
	generateSummarySchema,
	stockLedgerFilterSchema,
	stockLedgerSelectSchema,
	stockSummaryFilterSchema,
	stockSummarySelectSchema,
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
					const result = await s.summary.handleByLocation(query, query)
					return res.paginated(result)
				},
				{
					query: stockSummaryFilterSchema.extend(zPaginationDto.shape),
					response: createPaginatedResponseSchema(stockSummarySelectSchema),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)

			/* ─────── Stock Ledger Aggregation (date range, paginated) ─────── */
			.get(
				'/ledger',
				async function ledger({ query }) {
					const result = await s.summary.handleLedger(query, query)
					return res.paginated(result)
				},
				{
					query: stockLedgerFilterSchema.extend(zPaginationDto.shape),
					response: createPaginatedResponseSchema(stockLedgerSelectSchema),
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
					body: generateSummarySchema,
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
					query: zRecordIdDto,
					response: createSuccessResponseSchema(zRecordIdDto),
					auth: true,
					detail: { tags: ['Inventory Summary'] },
				},
			)
	)
}
