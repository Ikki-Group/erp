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
			async function list({ query }) {
				const result = await service.handleList(query)
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
			async function detail({ query }) {
				const order = await service.handleDetail(query.id)
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
			async function create({ body, auth }) {
				const { id } = await service.handleCreate(body, auth.userId)
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
			async function addBatch({ query, body, auth }) {
				const result = await service.handleAddBatch(query.id, body, auth.userId)
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
			async function close({ query, auth }) {
				const result = await service.handleClose(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/void',
			async function voidOrder({ query, body, auth }) {
				const result = await service.handleVoid(query.id, body, auth.userId)
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
