import Elysia, { t } from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamDto } from '../iam.dto'
import { UserRoleAssignmentSchema } from '../iam.types'
import type { IamUserRoleAssignmentsService } from '../service/user-role-assignments.service'

export function userRoleAssignmentRoute(s: IamUserRoleAssignmentsService) {
  return new Elysia()
    .get(
      '',
      async function getUserRoleAssignments({ query }) {
        const result = await s.list(query)
        return res.paginated(result)
      },
      {
        query: IamDto.ListUserRoleAssignments,
        response: zResponse.paginated(UserRoleAssignmentSchema.array()),
      }
    )
    .get(
      '/:id',
      async function getUserRoleAssignmentById({ params }) {
        const assignment = await s.getById(params.id)
        return res.ok(assignment)
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(UserRoleAssignmentSchema),
      }
    )
    .post(
      '',
      async function assignRole({ body }) {
        const assignment = await s.assign(body)
        return res.created(assignment, 'ROLE_ASSIGNED')
      },
      {
        body: IamDto.AssignRole,
        response: zResponse.ok(UserRoleAssignmentSchema),
      }
    )
    .delete(
      '/:id',
      async function revokeRole({ params }) {
        await s.revoke(params.id)
        return res.ok({ id: params.id }, 'ROLE_REVOKED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(
          z.object({
            id: zSchema.num,
          })
        ),
      }
    )
    .get(
      '/user/:userId/location/:locationId',
      async function getUserRolesAtLocation({ params }) {
        const assignments = await s.getUserRolesAtLocation(params.userId, params.locationId)
        return res.ok(assignments)
      },
      {
        params: t.Object({
          userId: t.Numeric(),
          locationId: t.Numeric(),
        }),
        response: zResponse.ok(UserRoleAssignmentSchema.array()),
      }
    )
    .get(
      '/user/:userId/role/:roleId',
      async function getUserLocationsForRole({ params }) {
        const assignments = await s.getUserLocationsForRole(params.userId, params.roleId)
        return res.ok(assignments)
      },
      {
        params: t.Object({
          userId: t.Numeric(),
          roleId: t.Numeric(),
        }),
        response: zResponse.ok(UserRoleAssignmentSchema.array()),
      }
    )
}
