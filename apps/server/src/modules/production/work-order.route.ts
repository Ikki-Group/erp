import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc } from '@/shared/schema'

import {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderFilterDto,
	WorkOrderDto,
} from './work-order.contract'
import type { WorkOrderModule } from './work-order.module'

export function createWorkOrderRoute(m: WorkOrderModule) {
	return new Elysia({ prefix: '/work-orders', detail: { tags: ['Production'] } })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
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
				const wo = await m.handleDetail(query.id)
				return res.ok(wo)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(WorkOrderDto), auth: true },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
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
				const result = await m.handleStart(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/complete',
			async ({ body, auth }) => {
				const result = await m.handleComplete(body.id, body, auth.userId)
				return res.ok(result)
			},
			{
				body: WorkOrderCompleteDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
