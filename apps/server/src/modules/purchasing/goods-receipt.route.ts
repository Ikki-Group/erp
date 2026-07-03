import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import {
	GoodsReceiptNoteDto,
	GoodsReceiptNoteSelectDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptNoteCreateDto,
} from './goods-receipt.contract'
import type { GoodsReceiptService } from './goods-receipt.service'

export function initGoodsReceiptRoute(service: GoodsReceiptService) {
	return new Elysia({ prefix: '/goods-receipt' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				body: GoodsReceiptNoteCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/complete',
			async function complete(context) {
				const result = await service.handleComplete(context.body.id, context.auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/remove',
			async function remove(context) {
				const result = await service.handleRemove(context.query.id, context.auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove(context) {
				const result = await service.handleHardRemove(context.query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
