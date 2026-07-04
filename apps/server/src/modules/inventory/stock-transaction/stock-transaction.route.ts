import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc } from '@/shared/schema'

import {
	AdjustmentTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
	PurchaseTransactionDto,
	SellTransactionDto,
	StockOpnameDto,
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	TransactionResultDto,
	TransferTransactionDto,
	UsageTransactionDto,
} from './stock-transaction.contract'
import type { StockTransactionService } from './stock-transaction.service'

export function initStockTransactionRoute(s: StockTransactionService) {
	return new Elysia({ prefix: '/transaction' })
		.use(authPluginMacro)
		.post(
			'/purchase',
			async ({ body, auth }) => {
				const result = await s.handlePurchase(body, auth.userId)
				return res.ok(result)
			},
			{
				body: PurchaseTransactionDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.post(
			'/transfer',
			async ({ body, auth }) => {
				const result = await s.handleTransfer(body, auth.userId)
				return res.ok(result)
			},
			{
				body: TransferTransactionDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.post(
			'/adjustment',
			async ({ body, auth }) => {
				const result = await s.handleAdjustment(body, auth.userId)
				return res.ok(result)
			},
			{
				body: AdjustmentTransactionDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.post(
			'/opname',
			async ({ body, auth }) => {
				const result = await s.handleOpname(body, auth.userId)
				return res.ok(result)
			},
			{
				body: StockOpnameDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.post(
			'/usage',
			async ({ body, auth }) => {
				const result = await s.handleUsage(body, auth.userId)
				return res.ok(result)
			},
			{
				body: UsageTransactionDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.post(
			'/sell',
			async ({ body, auth }) => {
				const result = await s.handleSell(body, auth.userId)
				return res.ok(result)
			},
			{
				body: SellTransactionDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.post(
			'/production-in',
			async ({ body, auth }) => {
				const result = await s.handleProductionIn(body, auth.userId)
				return res.ok(result)
			},
			{
				body: ProductionInTransactionDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.post(
			'/production-out',
			async ({ body, auth }) => {
				const result = await s.handleProductionOut(body, auth.userId)
				return res.ok(result)
			},
			{
				body: ProductionOutTransactionDto,
				response: createSuccessResponseDto(TransactionResultDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.get(
			'/list',
			async ({ query }) => {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: StockTransactionFilterDto,
				response: createPaginatedResponseDto(StockTransactionSelectDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const data = await s.handleDetail(query.id)
				return res.ok(data)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(StockTransactionDto),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await s.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
				detail: { tags: ['Inventory Transaction'] },
			},
		)
}
