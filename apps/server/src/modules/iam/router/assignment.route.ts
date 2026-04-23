import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/core/validation'

import * as dto from '../dto/assignment.dto'
import type { UserAssignmentService } from '../service/assignment.service'

export function initUserAssignmentRoute(service: UserAssignmentService) {
	return new Elysia({ prefix: '/assignment' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleGetListPaginated(query)
				return res.paginated(result)
			},
			{
				query: dto.UserAssignmentFilterDto,
				response: createPaginatedResponseSchema(dto.UserAssignmentDto),
				auth: true,
			},
		)
		.post(
			'/assign',
			async function assign({ body, auth }) {
				await service.handleAssignToLocation(body, auth.userId)
				return res.ok({ success: true })
			},
			{
				body: dto.UserAssignmentUpsertDto,
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body }) {
				await service.handleRemoveFromLocation(body.userId, body.locationId)
				return res.ok({ success: true })
			},
			{
				body: z.object({
					userId: z.number().int().positive(),
					locationId: z.number().int().positive(),
				}),
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
}
