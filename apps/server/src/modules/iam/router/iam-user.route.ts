import Elysia from 'elysia'
import z from 'zod'

import { logger } from '@/lib/logger'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamSchema } from '../iam.schema'
import type { IamServiceModule } from '../service'

const MAX_ACCESS_ASSIGNMENTS_LIMIT = 100

export function initIamUserRoute(service: IamServiceModule) {
  return new Elysia()
    .get(
      '/list',
      async function getUsers({ query }) {
        const { isActive, search, page, limit } = query
        const result = await service.users.listPaginated({ isActive, search }, { page, limit })
        logger.withMetadata(result).debug('Users List Response')
        return res.paginated(result)
      },
      {
        isAuth: true,
        query: z.object({
          ...zSchema.pagination.shape,
          search: zSchema.query.search,
          isActive: zSchema.query.boolean,
        }),
        response: zResponse.paginated(IamSchema.User.array()),
      }
    )
    .get(
      '/detail',
      async function getUserById({ query }) {
        const user = await service.auth.getUserDetails(query.id)
        return res.ok(user)
      },
      {
        isAuth: true,
        query: z.object({ id: zSchema.query.idRequired }),
        response: zResponse.ok(IamSchema.UserWithAccess),
      }
    )
    .get(
      '/access',
      async function getUserAccess({ query }) {
        const user = await service.users.getById(query.id)

        // Root users have access to everything — no need to query assignments table
        if (user.isRoot) {
          return res.ok({ isRoot: true, assignments: [] })
        }

        const assignments = await service.userRoleAssignments.listPaginatedWithDetails(
          { userId: query.id },
          { page: 1, limit: MAX_ACCESS_ASSIGNMENTS_LIMIT }
        )

        return res.ok({
          isRoot: user.isRoot,
          assignments: assignments.data,
        })
      },
      {
        isAuth: true,
        query: z.object({ id: zSchema.query.idRequired }),
        response: zResponse.ok(
          z.object({
            isRoot: zSchema.bool,
            assignments: IamSchema.UserRoleAssignmentDetail.array(),
          })
        ),
      }
    )
    .post(
      '/create',
      async function createUser({ body }) {
        const user = await service.users.createWithRoles(body)
        return res.created(user, 'USER_CREATED')
      },
      {
        isAuth: true,
        body: IamSchema.UserCreateDto,
        response: zResponse.ok(IamSchema.User),
      }
    )
    .put(
      '/update',
      async function updateUser({ body }) {
        const user = await service.users.updateWithRoles(body.id, body)
        return res.ok(user, 'USER_UPDATED')
      },
      {
        isAuth: true,
        body: IamSchema.UserUpdateDto,
        response: zResponse.ok(IamSchema.User),
      }
    )
    .delete(
      '/delete',
      async function deleteUser({ body }) {
        await service.users.delete(body.id)
        return res.ok({ id: body.id }, 'USER_DELETED')
      },
      {
        isAuth: true,
        body: IamSchema.User.pick({ id: true }),
        response: zResponse.ok(IamSchema.User.pick({ id: true })),
      }
    )
    .patch(
      '/toggle-active',
      async function toggleUserActive({ body }) {
        const user = await service.users.toggleActive(body.id)
        return res.ok(user, 'USER_STATUS_TOGGLED')
      },
      {
        isAuth: true,
        body: IamSchema.User.pick({ id: true }),
        response: zResponse.ok(IamSchema.User),
      }
    )
}
