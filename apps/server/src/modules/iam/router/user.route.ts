import Elysia from 'elysia'
import z from 'zod'

import { logger } from '@/lib/logger'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamSchema, UserRoleAssignmentDetailSchema } from '../iam.types'
import type { IamUserRoleAssignmentsService } from '../service/user-role-assignments.service'
import type { IamUsersService } from '../service/users.service'

/**
 * IAM User Route
 */
export function buildIamUserRoute(s: IamUsersService, assignmentsService: IamUserRoleAssignmentsService) {
  return new Elysia()
    .get(
      '/list',
      async function getUsers({ query }) {
        const { isActive, search, page, limit } = query
        const result = await s.listPaginated({ isActive, search }, { page, limit })
        logger.withMetadata(result).debug('Users List Response')
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          search: z.string().optional(),
          isActive: z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        }),
        isAuth: true,
        hasPermission: 'iam.users.read',
        response: zResponse.paginated(IamSchema.User.array()),
      }
    )
    .get(
      '/detail',
      async function getUserById({ query }) {
        const user = await s.getById(query.id)
        return res.ok(user)
      },
      {
        query: IamSchema.User.pick({ id: true }),
        response: zResponse.ok(IamSchema.User),
      }
    )
    .get(
      '/access',
      async function getUserAccess({ query }) {
        const user = await s.getById(query.id)

        // If root user, they have access to everything (not implemented in assignments table)
        // For the dashboard, we might want to return assignments or a special flag
        const assignments = await assignmentsService.listPaginatedWithDetails(
          { userId: query.id },
          { page: 1, limit: 100 } // Assume 100 is enough for a summary
        )

        return res.ok({
          isRoot: user.isRoot,
          assignments: assignments.data,
        })
      },
      {
        query: IamSchema.User.pick({ id: true }),
        response: zResponse.ok(
          z.object({
            isRoot: zSchema.bool,
            assignments: UserRoleAssignmentDetailSchema.array(),
          })
        ),
      }
    )
    .post(
      '/create',
      async function createUser({ body }) {
        const user = await s.create(body)
        return res.created(user, 'USER_CREATED')
      },
      {
        body: IamSchema.User.pick({
          email: true,
          username: true,
          fullname: true,
        }).extend({
          password: zSchema.password,
        }),
        response: zResponse.ok(IamSchema.User),
      }
    )
    .put(
      '/update',
      async function updateUser({ body }) {
        const user = await s.update(body.id, body)
        return res.ok(user, 'USER_UPDATED')
      },
      {
        body: IamSchema.User.pick({
          id: true,
          email: true,
          username: true,
          fullname: true,
          isActive: true,
        })
          .partial({
            email: true,
            username: true,
            fullname: true,
            isActive: true,
          })
          .extend({
            password: zSchema.password.optional(),
          }),
        response: zResponse.ok(IamSchema.User),
      }
    )
    .delete(
      '/delete',
      async function deleteUser({ body }) {
        await s.delete(body.id)
        return res.ok({ id: body.id }, 'USER_DELETED')
      },
      {
        body: IamSchema.User.pick({ id: true }),
        response: zResponse.ok(IamSchema.User.pick({ id: true })),
      }
    )
    .patch(
      '/toggle-active',
      async function toggleUserActive({ body }) {
        const user = await s.toggleActive(body.id)
        return res.ok(user, 'USER_STATUS_TOGGLED')
      },
      {
        body: IamSchema.User.pick({ id: true }),
        response: zResponse.ok(IamSchema.User),
      }
    )
}
