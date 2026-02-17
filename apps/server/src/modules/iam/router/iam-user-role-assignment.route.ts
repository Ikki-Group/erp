import Elysia from 'elysia'
import z from 'zod'

import { logger } from '@/lib/logger'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamSchema } from '../iam.schema'
import type { IamServiceModule } from '../service'

export function initIamUserRoleAssignmentRoute(service: IamServiceModule) {
  return new Elysia()
    .get(
      '/list',
      async function getAssignments({ query }) {
        const { userId, roleId, locationId, page, limit, withDetails } = query
        const filter = { userId, roleId, locationId }
        const pq = { page, limit }

        const result = withDetails
          ? await service.userRoleAssignments.listPaginatedWithDetails(filter, pq)
          : await service.userRoleAssignments.listPaginated(filter, pq)

        logger.withMetadata(result).debug('Assignments List Response')
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          userId: zSchema.query.id,
          roleId: zSchema.query.id,
          locationId: zSchema.query.id,
          withDetails: zSchema.query.boolean.default(false),
        }),
        response: zResponse.paginated(
          z.union([IamSchema.UserRoleAssignment, IamSchema.UserRoleAssignmentDetail]).array()
        ),
      }
    )
    .get(
      '/detail',
      async function getAssignmentById({ query }) {
        const assignment = await service.userRoleAssignments.getById(query.id)
        return res.ok(assignment)
      },
      {
        query: z.object({ id: zSchema.query.idRequired }),
        response: zResponse.ok(IamSchema.UserRoleAssignment),
      }
    )
    .post(
      '/assign',
      async function assignRole({ body }) {
        const assignment = await service.userRoleAssignments.assign(body)
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
        await service.userRoleAssignments.revoke(body.id)
        return res.ok({ id: body.id }, 'ROLE_REVOKED')
      },
      {
        body: IamSchema.UserRoleAssignment.pick({ id: true }),
        response: zResponse.ok(IamSchema.UserRoleAssignment.pick({ id: true })),
      }
    )
}
