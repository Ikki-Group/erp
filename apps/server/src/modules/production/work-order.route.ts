import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderFilterDto,
	WorkOrderDto,
} from './work-order.contract'
import type { WorkOrderService } from './work-order.service'

export function initWorkOrderRoute(service: WorkOrderService) {
	return new Elysia({ prefix: '/work-orders', detail: { tags: ['Production'] } })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: WorkOrderFilterDto,
				response: createPaginatedResponseDto(WorkOrderDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const wo = await service.handleDetail(query.id)
				return res.ok(wo)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(WorkOrderDto), auth: true },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: WorkOrderCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/start',
			async ({ query, auth }) => {
				const result = await service.handleStart(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/complete',
			async ({ body, auth }) => {
				const result = await service.handleComplete(body.id, body, auth.userId)
				return res.ok(result)
			},
			{
				body: WorkOrderCompleteDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
