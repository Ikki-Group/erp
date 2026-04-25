import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zp } from '@/core/validation'

import * as dto from '../dto/assignment.dto'
import type { AssignmentUsecases } from '../usecase/assignment.usecase'

export function initUserAssignmentRoute(usecase: AssignmentUsecases) {
	return new Elysia({ prefix: '/assignment' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await usecase.handleGetListPaginated(query)
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
				await usecase.handleAssignToLocation(body, auth.userId)
				return res.ok({ success: true })
			},
			{
				body: dto.UserAssignmentUpsertDto,
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
		.post(
			'/assign-bulk',
			async function assignBulk({ body, auth }) {
				await usecase.handleAssignUsersToLocation(
					body.userIds,
					body.locationId,
					body.roleId,
					auth.userId,
				)
				return res.ok({ success: true })
			},
			{
				body: z.object({
					userIds: z.array(zp.id),
					locationId: zp.id,
					roleId: zp.id,
				}),
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
		.post(
			'/update-role-bulk',
			async function updateRoleBulk({ body, auth }) {
				await usecase.handleUpdateRoleForUsersInLocation(
					body.userIds,
					body.locationId,
					body.roleId,
					auth.userId,
				)
				return res.ok({ success: true })
			},
			{
				body: z.object({
					userIds: z.array(zp.id),
					locationId: zp.id,
					roleId: zp.id,
				}),
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body }) {
				await usecase.handleRemoveFromLocation(body.userId, body.locationId)
				return res.ok({ success: true })
			},
			{
				body: z.object({
					userId: zp.id,
					locationId: zp.id,
				}),
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
		.delete(
			'/remove-bulk',
			async function removeBulk({ body }) {
				await usecase.handleRemoveUsersFromLocation(body.userIds, body.locationId)
				return res.ok({ success: true })
			},
			{
				body: z.object({
					userIds: z.array(zp.id),
					locationId: zp.id,
				}),
				response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
				auth: true,
			},
		)
}
