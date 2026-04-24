import { Elysia } from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/core/validation'

import {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
} from '../dto'
import type { SalesServiceModule } from '../service'

export function initSalesOrderRoute(s: SalesServiceModule) {
	return new Elysia({ prefix: '/order' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.order.handleList(query, query)
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
				const order = await s.order.handleDetail(query.id)
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
				const { id } = await s.order.handleCreate(body, auth.userId)
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
				const result = await s.order.handleAddBatch(query.id, body, auth.userId)
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
				const result = await s.order.handleClose(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/void',
			async function voidOrder({ query, body, auth }) {
				const result = await s.order.handleVoid(query.id, body, auth.userId)
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
