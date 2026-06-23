import { zc } from '@/shared/schema'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	GoodsReceiptNoteFilterSchema,
	GoodsReceiptNoteSelectSchema,
	GoodsReceiptNoteSchema,
	GoodsReceiptNoteCreateSchema,
} from './goods-receipt.contract'
import type { GoodsReceiptService } from './goods-receipt.service'

export function initGoodsReceiptRoute(service: GoodsReceiptService) {
	return new Elysia({ prefix: '/goods-receipt' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: GoodsReceiptNoteFilterSchema,
				response: createPaginatedResponseSchema(GoodsReceiptNoteSelectSchema),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseSchema(GoodsReceiptNoteSchema),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: GoodsReceiptNoteCreateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/complete',
			async function complete({ body, auth }) {
				const result = await service.handleComplete(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const result = await service.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ query }) {
				const result = await service.handleHardRemove(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
