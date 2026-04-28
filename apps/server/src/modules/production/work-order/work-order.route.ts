import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc } from '@/core/validation'

import {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderFilterDto,
	WorkOrderDto,
	WorkOrderSelectDto,
} from './work-order.dto'
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
				response: createPaginatedResponseSchema(WorkOrderSelectDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const wo = await service.handleDetail(query.id)
				return res.ok(wo)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(WorkOrderDto), auth: true },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: WorkOrderCreateDto,
				response: createSuccessResponseSchema(WorkOrderDto),
				auth: true,
			},
		)
		.post(
			'/start',
			async ({ query, auth }) => {
				const result = await service.handleStart(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(WorkOrderDto), auth: true },
		)
		.post(
			'/complete',
			async ({ body, auth }) => {
				const result = await service.handleComplete(body.id, body, auth.userId)
				return res.ok(result)
			},
			{
				body: WorkOrderCompleteDto,
				response: createSuccessResponseSchema(WorkOrderDto),
				auth: true,
			},
		)
}
