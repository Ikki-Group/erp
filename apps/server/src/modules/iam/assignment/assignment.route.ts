import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, successNoDataSchema } from '@/core/validation'

import * as dto from './assignment.dto'
import type { UserAssignmentService } from './assignment.service'

export function initAssignmentRoute(service: UserAssignmentService) {
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
				return res.noData()
			},
			{
				body: dto.UserAssignmentUpsertDto,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.post(
			'/assign-bulk',
			async function assignBulk({ body, auth }) {
				await service.handleAssignUsersToLocation(
					body.userIds,
					body.locationId,
					body.roleId,
					auth.userId,
				)
				return res.noData()
			},
			{
				body: dto.AssignmentBulkBodyDto,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.post(
			'/update-role-bulk',
			async function updateRoleBulk({ body, auth }) {
				await service.handleUpdateRoleForUsersInLocation(
					body.userIds,
					body.locationId,
					body.roleId,
					auth.userId,
				)
				return res.noData()
			},
			{
				body: dto.AssignmentBulkBodyDto,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body }) {
				await service.handleRemoveFromLocation(body.userId, body.locationId)
				return res.noData()
			},
			{
				body: dto.AssignmentRemoveBodyDto,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.delete(
			'/remove-bulk',
			async function removeBulk({ body }) {
				await service.handleRemoveUsersFromLocation(body.userIds, body.locationId)
				return res.noData()
			},
			{
				body: dto.AssignmentRemoveBulkBodyDto,
				response: successNoDataSchema,
				auth: true,
			},
		)
}
