import { Elysia } from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
} from './sales-order.dto'
import type { SalesOrderService } from './sales-order.service'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/lib/validation'

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
				response: createPaginatedResponseSchema(SalesOrderOutputDto),
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
				query: zc.RecordId,
				response: createSuccessResponseSchema(SalesOrderOutputDto),
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
				response: createSuccessResponseSchema(zc.RecordId),
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
				query: zc.RecordId,
				body: SalesOrderAddBatchDto,
				response: createSuccessResponseSchema(z.object({ batchId: z.number() })),
				auth: true,
			},
		)
		.post(
			'/close',
			async function close({ query, auth }) {
				const result = await service.handleClose(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/void',
			async function voidOrder({ query, body, auth }) {
				const result = await service.handleVoid(query.id, body, auth.userId)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				body: SalesOrderVoidDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
