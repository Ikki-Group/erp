import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zc, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import {
	AdjustmentTransactionDto,
	PurchaseTransactionDto,
	StockOpnameDto,
	StockTransactionFilterDto,
	StockTransactionDto,
	StockTransactionSelectDto,
	TransactionResultDto,
	TransferTransactionDto,
	UsageTransactionDto,
	SellTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
} from './stock-transaction.dto'
import type { StockTransactionService } from './stock-transaction.service'

export function initStockTransactionRoute(s: StockTransactionService) {
	return (
		new Elysia({ prefix: '/transaction' })
			.use(authPluginMacro)

			/* ─────── Record purchases (multiple materials) ─────── */
			.post(
				'/purchase',
				async function purchase({ body, auth }) {
					const result = await s.handlePurchase(body, auth.userId)
					return res.ok(result)
				},
				{
					body: PurchaseTransactionDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Transfer stock between locations (multiple materials) ─────── */
			.post(
				'/transfer',
				async function transfer({ body, auth }) {
					const result = await s.handleTransfer(body, auth.userId)
					return res.ok(result)
				},
				{
					body: TransferTransactionDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record stock adjustments (multiple materials) ─────── */
			.post(
				'/adjustment',
				async function adjustment({ body, auth }) {
					const result = await s.handleAdjustment(body, auth.userId)
					return res.ok(result)
				},
				{
					body: AdjustmentTransactionDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record stock opname (multiple materials) ─────── */
			.post(
				'/opname',
				async function opname({ body, auth }) {
					const result = await s.handleOpname(body, auth.userId)
					return res.ok(result)
				},
				{
					body: StockOpnameDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record material usage (multiple materials) ─────── */
			.post(
				'/usage',
				async function usage({ body, auth }) {
					const result = await s.handleUsage(body, auth.userId)
					return res.ok(result)
				},
				{
					body: UsageTransactionDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record direct sell (multiple materials) ─────── */
			.post(
				'/sell',
				async function sell({ body, auth }) {
					const result = await s.handleSell(body, auth.userId)
					return res.ok(result)
				},
				{
					body: SellTransactionDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record production input (multiple materials) ─────── */
			.post(
				'/production-in',
				async function productionIn({ body, auth }) {
					const result = await s.handleProductionIn(body, auth.userId)
					return res.ok(result)
				},
				{
					body: ProductionInTransactionDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record production output/consume (multiple materials) ─────── */
			.post(
				'/production-out',
				async function productionOut({ body, auth }) {
					const result = await s.handleProductionOut(body, auth.userId)
					return res.ok(result)
				},
				{
					body: ProductionOutTransactionDto,
					response: createSuccessResponseSchema(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── List transactions (paginated) ─────── */
			.get(
				'/list',
				async function list({ query }) {
					const result = await s.handleList(query)
					return res.paginated(result)
				},
				{
					query: StockTransactionFilterDto,
					response: createPaginatedResponseSchema(StockTransactionSelectDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Get transaction detail ─────── */
			.get(
				'/detail',
				async function detail({ query }) {
					const data = await s.handleDetail(query.id)
					return res.ok(data)
				},
				{
					query: zc.RecordId,
					response: createSuccessResponseSchema(StockTransactionDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Soft delete transaction ─────── */
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
					detail: { tags: ['Inventory Transaction'] },
				},
			)
	)
}
