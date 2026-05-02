import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zp,
} from '@/core/validation'

import * as dto from './session.dto'
import type { SessionService } from './session.service'

export function initSessionRoute(service: SessionService) {
	return new Elysia({ prefix: '/session' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.SessionFilterDto,
				response: createPaginatedResponseSchema(dto.SessionSelectDto),
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
				response: createSuccessResponseSchema(dto.SessionDto),
				auth: true,
			},
		)
		.get(
			'/my-sessions',
			async function mySessions({ auth }) {
				const result = await service.handleGetByUserId(auth.userId)
				return res.ok(result)
			},
			{
				response: createSuccessResponseSchema(z.array(dto.SessionDto)),
				auth: true,
			},
		)
		.get(
			'/my-active-sessions',
			async function myActiveSessions({ auth }) {
				const result = await service.handleGetActiveByUserId(auth.userId)
				return res.ok(result)
			},
			{
				response: createSuccessResponseSchema(z.array(dto.SessionDto)),
				auth: true,
			},
		)
		.post(
			'/invalidate',
			async function invalidate({ body }) {
				const result = await service.handleInvalidate(body)
				return res.ok(result)
			},
			{
				body: dto.SessionInvalidateDto,
				response: createSuccessResponseSchema(z.object({ count: zp.num })),
				auth: true,
			},
		)
		.post(
			'/invalidate-all',
			async function invalidateAll({ body, auth }) {
				const result = await service.handleInvalidateAll({
					userId: auth.userId,
					exceptCurrentSessionId: body.exceptCurrentSessionId,
				})
				return res.ok(result)
			},
			{
				body: z.object({
					exceptCurrentSessionId: zp.id.optional(),
				}),
				response: createSuccessResponseSchema(z.object({ count: zp.num })),
				auth: true,
			},
		)
		.post(
			'/invalidate-expired',
			async function invalidateExpired() {
				const result = await service.handleInvalidateExpired()
				return res.ok(result)
			},
			{
				response: createSuccessResponseSchema(z.object({ count: zp.num })),
				auth: true,
			},
		)
}
