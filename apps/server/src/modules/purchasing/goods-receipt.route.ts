import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc } from '@/shared/schema'

import {
	GoodsReceiptNoteDto,
	GoodsReceiptNoteSelectDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptNoteCreateDto,
} from './goods-receipt.contract'
import type { GoodsReceiptModule } from './goods-receipt.module'

export function createGoodsReceiptRoute(m: GoodsReceiptModule) {
	return new Elysia({ prefix: '/goods-receipt' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: GoodsReceiptNoteFilterDto,
				response: createPaginatedResponseDto(GoodsReceiptNoteSelectDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(GoodsReceiptNoteDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: GoodsReceiptNoteCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/complete',
			async ({ body, auth }) => {
				const result = await m.handleComplete(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await m.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async ({ query }) => {
				const result = await m.handleHardRemove(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
