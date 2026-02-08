import Elysia from 'elysia'
import z from 'zod'

import { logger } from '@/lib/logger'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { UserRoleAssignmentDetailSchema, UserRoleAssignmentSchema } from '../iam.types'
import type { IamUserRoleAssignmentsService } from '../service/user-role-assignments.service'

/**
 * IAM User Role Assignment Routes
 */
export function buildIamUserRoleAssignmentRoute(s: IamUserRoleAssignmentsService) {
  return new Elysia()
    .get(
      '/list',
      async function getAssignments({ query }) {
        const { userId, roleId, locationId, page, limit, withDetails } = query
        const filter = { userId, roleId, locationId }
        const pq = { page, limit }

        const result = withDetails ? await s.listPaginatedWithDetails(filter, pq) : await s.listPaginated(filter, pq)

        logger.withMetadata(result).debug('Assignments List Response')
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          userId: zSchema.numCoerce.optional(),
          roleId: zSchema.numCoerce.optional(),
          locationId: zSchema.numCoerce.optional(),
          withDetails: z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional()
            .default(false),
        }),
        response: zResponse.paginated(z.union([UserRoleAssignmentSchema, UserRoleAssignmentDetailSchema]).array()),
      }
    )
    .get(
      '/detail',
      async function getAssignmentById({ query }) {
        const assignment = await s.getById(query.id)
        return res.ok(assignment)
      },
      {
        query: UserRoleAssignmentSchema.pick({ id: true }),
        response: zResponse.ok(UserRoleAssignmentSchema),
      }
    )
    .post(
      '/assign',
      async function assignRole({ body }) {
        const assignment = await s.assign(body)
        return res.created(assignment, 'ROLE_ASSIGNED')
      },
      {
        body: UserRoleAssignmentSchema.pick({
          userId: true,
          roleId: true,
          locationId: true,
        }),
        response: zResponse.ok(UserRoleAssignmentSchema),
      }
    )
    .delete(
      '/revoke',
      async function revokeRole({ body }) {
        await s.revoke(body.id)
        return res.ok({ id: body.id }, 'ROLE_REVOKED')
      },
      {
        body: UserRoleAssignmentSchema.pick({ id: true }),
        response: zResponse.ok(UserRoleAssignmentSchema.pick({ id: true })),
      }
    )
}
