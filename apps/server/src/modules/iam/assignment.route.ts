import { Elysia } from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { createPaginatedResponseSchema, successNoDataSchema } from '@/shared/validation'

import {
	UserAssignmentFilterSchema,
	UserAssignmentSchema,
	UserAssignmentUpsertSchema,
	AssignmentBulkBodySchema,
	AssignmentRemoveBodySchema,
	AssignmentRemoveBulkBodySchema,
} from './assignment.schema'
import type { UserAssignmentService } from './assignment.service'

export function createAssignmentRoute(svc: UserAssignmentService) {
	return new Elysia({ prefix: '/assignment' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await svc.handleGetListPaginated(query)), {
			query: UserAssignmentFilterSchema,
			response: createPaginatedResponseSchema(UserAssignmentSchema),
			auth: true,
		})
		.post(
			'/assign',
			async ({ body, auth }) => {
				await svc.handleAssignToLocation(body, auth.userId)
				return res.noData()
			},
			{
				body: UserAssignmentUpsertSchema,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.post(
			'/assign-bulk',
			async ({ body, auth }) => {
				await svc.handleAssignUsersToLocation(
					body.userIds,
					body.locationId,
					body.roleId,
					auth.userId,
				)
				return res.noData()
			},
			{
				body: AssignmentBulkBodySchema,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.post(
			'/update-role-bulk',
			async ({ body, auth }) => {
				await svc.handleUpdateRoleForUsersInLocation(
					body.userIds,
					body.locationId,
					body.roleId,
					auth.userId,
				)
				return res.noData()
			},
			{
				body: AssignmentBulkBodySchema,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body }) => {
				await svc.handleRemoveFromLocation(body.userId, body.locationId)
				return res.noData()
			},
			{
				body: AssignmentRemoveBodySchema,
				response: successNoDataSchema,
				auth: true,
			},
		)
		.delete(
			'/remove-bulk',
			async ({ body }) => {
				await svc.handleRemoveUsersFromLocation(body.userIds, body.locationId)
				return res.noData()
			},
			{
				body: AssignmentRemoveBulkBodySchema,
				response: successNoDataSchema,
				auth: true,
			},
		)
}
