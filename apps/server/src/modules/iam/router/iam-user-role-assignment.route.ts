import Elysia from 'elysia'
import z from 'zod'

import { logger } from '@/lib/logger'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamSchema } from '../iam.types'
import type { IamServiceModule } from '../service'

export function initIamUserRoleAssignmentRoute(s: IamServiceModule) {
  return new Elysia()
    .get(
      '/list',
      async function getAssignments({ query }) {
        const { userId, roleId, locationId, page, limit, withDetails } = query
        const filter = { userId, roleId, locationId }
        const pq = { page, limit }

        const result = withDetails
          ? await s.userRoleAssignments.listPaginatedWithDetails(filter, pq)
          : await s.userRoleAssignments.listPaginated(filter, pq)

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
        response: zResponse.paginated(
          z.union([IamSchema.UserRoleAssignment, IamSchema.UserRoleAssignmentDetail]).array()
        ),
      }
    )
    .get(
      '/detail',
      async function getAssignmentById({ query }) {
        const assignment = await s.userRoleAssignments.getById(query.id)
        return res.ok(assignment)
      },
      {
        query: IamSchema.UserRoleAssignment.pick({ id: true }),
        response: zResponse.ok(IamSchema.UserRoleAssignment),
      }
    )
    .post(
      '/assign',
      async function assignRole({ body }) {
        const assignment = await s.userRoleAssignments.assign(body)
        return res.created(assignment, 'ROLE_ASSIGNED')
      },
      {
        body: IamSchema.UserRoleAssignment.pick({
          userId: true,
          roleId: true,
          locationId: true,
        }),
        response: zResponse.ok(IamSchema.UserRoleAssignment),
      }
    )
    .delete(
      '/revoke',
      async function revokeRole({ body }) {
        await s.userRoleAssignments.revoke(body.id)
        return res.ok({ id: body.id }, 'ROLE_REVOKED')
      },
      {
        body: IamSchema.UserRoleAssignment.pick({ id: true }),
        response: zResponse.ok(IamSchema.UserRoleAssignment.pick({ id: true })),
      }
    )
}
