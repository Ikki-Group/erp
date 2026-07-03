import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

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
} from './stock-transaction.contract'
import type { StockTransactionService } from './stock-transaction.service'

export function initStockTransactionRoute(s: StockTransactionService) {
	return (
		new Elysia({ prefix: '/transaction' })
			.use(authPluginMacro)

			/* ─────── Record purchases (multiple materials) ─────── */
			.post(
				'/purchase',
				async function purchase(context) {
					const result = await s.handlePurchase(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: PurchaseTransactionDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Transfer stock between locations (multiple materials) ─────── */
			.post(
				'/transfer',
				async function transfer(context) {
					const result = await s.handleTransfer(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: TransferTransactionDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record stock adjustments (multiple materials) ─────── */
			.post(
				'/adjustment',
				async function adjustment(context) {
					const result = await s.handleAdjustment(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: AdjustmentTransactionDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record stock opname (multiple materials) ─────── */
			.post(
				'/opname',
				async function opname(context) {
					const result = await s.handleOpname(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: StockOpnameDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record material usage (multiple materials) ─────── */
			.post(
				'/usage',
				async function usage(context) {
					const result = await s.handleUsage(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: UsageTransactionDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record direct sell (multiple materials) ─────── */
			.post(
				'/sell',
				async function sell(context) {
					const result = await s.handleSell(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: SellTransactionDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record production input (multiple materials) ─────── */
			.post(
				'/production-in',
				async function productionIn(context) {
					const result = await s.handleProductionIn(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: ProductionInTransactionDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Record production output/consume (multiple materials) ─────── */
			.post(
				'/production-out',
				async function productionOut(context) {
					const result = await s.handleProductionOut(context.body, context.auth.userId)
					return res.ok(result)
				},
				{
					body: ProductionOutTransactionDto,
					response: createSuccessResponseDto(TransactionResultDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── List transactions (paginated) ─────── */
			.get(
				'/list',
				async function list(context) {
					const result = await s.handleList(context.query)
					return res.paginated(result)
				},
				{
					query: StockTransactionFilterDto,
					response: createPaginatedResponseDto(StockTransactionSelectDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Get transaction detail ─────── */
			.get(
				'/detail',
				async function detail(context) {
					const data = await s.handleDetail(context.query.id)
					return res.ok(data)
				},
				{
					query: zc.RecordId,
					response: createSuccessResponseDto(StockTransactionDto),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)

			/* ─────── Soft delete transaction ─────── */
			.delete(
				'/remove',
				async function remove(context) {
					await s.handleRemove(context.query.id, context.auth.userId)
					return res.ok({ id: context.query.id })
				},
				{
					query: zc.RecordId,
					response: createSuccessResponseDto(zc.RecordId),
					auth: true,
					detail: { tags: ['Inventory Transaction'] },
				},
			)
	)
}
