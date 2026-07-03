import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zq } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'

import {
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeCreateDto,
	SalesTypeUpdateDto,
} from './sales-type.contract'
import type { SalesTypeService } from './sales-type.service'

export function initSalesTypeRoute(service: SalesTypeService) {
	return new Elysia({ prefix: '/sales-type' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
				return res.paginated(result)
			},
			{
				query: SalesTypeFilterDto,
				response: createPaginatedResponseDto(SalesTypeDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail(context) {
				const salesType = await service.handleDetail(context.query.id)
				return res.ok(salesType)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(SalesTypeDto), auth: true },
		)
		.post(
			'/create',
			async function create(context) {
				const { id } = await service.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{
				body: SalesTypeCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update(context) {
				const { id } = await service.handleUpdate(
					context.body.id,
					context.body,
					context.auth.userId,
				)
				return res.ok({ id })
			},
			{
				body: SalesTypeUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				await service.handleRemove(context.query.id)
				return res.ok({ id: context.query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
