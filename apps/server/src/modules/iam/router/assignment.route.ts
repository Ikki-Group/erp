import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/core/validation'

import * as dto from '../dto/assignment.dto'
import type { UserAssignmentService } from '../service/assignment.service'

/**
 * User Assignment Module Route (Layer 1)
 */
export function initUserAssignmentRoute(service: UserAssignmentService) {
	return new Elysia({ prefix: '/assignment' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.UserAssignmentFilterDto,
				response: createPaginatedResponseSchema(dto.UserAssignmentDetailDto),
				auth: true,
			},
		)
		.post(
			'/assign',
			async function assign({ body, auth }) {
				await service.execAssign(body, auth.userId)
				return res.ok({ success: true })
			},
			{
				body: dto.UserAssignmentUpsertDto.omit({ isDefault: true }),
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body }) {
				await service.execRemove(body.userId, body.locationId)
				return res.ok({ success: true })
			},
			{
				body: dto.UserAssignmentUpsertDto.omit({ isDefault: true, roleId: true }),
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
}
