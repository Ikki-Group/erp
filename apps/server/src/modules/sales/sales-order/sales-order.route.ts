import { z, zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'
import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
} from './sales-order.contract'
import type { SalesOrderService } from './sales-order.service'

export function initSalesOrderRoute(service: SalesOrderService) {
	return new Elysia({ prefix: '/order' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
				return res.paginated(result)
			},
			{
				query: z.object({ ...SalesOrderFilterDto.shape, ...zq.pagination.shape }),
				response: createPaginatedResponseDto(SalesOrderOutputDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail(context) {
				const order = await service.handleDetail(context.query.id)
				return res.ok(order)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(SalesOrderOutputDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create(context) {
				const { id } = await service.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{
				body: SalesOrderCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/add-batch',
			async function addBatch(context) {
				const result = await service.handleAddBatch(context.query.id, context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				body: SalesOrderAddBatchDto,
				response: createSuccessResponseDto(z.object({ batchId: z.number() })),
				auth: true,
			},
		)
		.post(
			'/close',
			async function close(context) {
				const result = await service.handleClose(context.query.id, context.auth.userId)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/void',
			async function voidOrder(context) {
				const result = await service.handleVoid(context.query.id, context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				body: SalesOrderVoidDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
