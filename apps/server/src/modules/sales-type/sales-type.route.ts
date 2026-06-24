import { zc, zq } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

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
			async function list({ query }) {
				const result = await service.handleList(query)
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
			async function detail({ query }) {
				const salesType = await service.handleDetail(query.id)
				return res.ok(salesType)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(SalesTypeDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await service.handleCreate(body, auth.userId)
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
			async function update({ body, auth }) {
				const { id } = await service.handleUpdate(body.id, body, auth.userId)
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
			async function remove({ query }) {
				await service.handleRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
