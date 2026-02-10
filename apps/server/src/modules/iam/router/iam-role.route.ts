import { logger } from '@server/lib/logger'
import { res } from '@server/lib/utils/response.util'
import { zResponse, zSchema } from '@server/lib/zod'
import Elysia from 'elysia'
import z from 'zod'

import { IamSchema } from '../iam.types'
import type { IamService } from '../service'

export function buildIamRoleRoute(s: IamService) {
  return new Elysia()
    .get(
      '/list',
      async function getRoles({ query }) {
        const { isSystem, search, page, limit } = query
        const result = await s.roles.listPaginated({ isSystem, search }, { page, limit })
        logger.withMetadata(result).debug('Res')
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          search: z.string().optional(),
          isSystem: z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        }),
        response: zResponse.paginated(IamSchema.Role.array()),
      }
    )
    .get(
      '/detail',
      async function getRoleById({ query }) {
        const role = await s.roles.getById(query.id)
        return res.ok(role)
      },
      {
        query: IamSchema.Role.pick({ id: true }),
        response: zResponse.ok(IamSchema.Role),
      }
    )
    .post(
      '/create',
      async function createRole({ body }) {
        const role = await s.roles.create(body)
        return res.created(role, 'ROLE_CREATED')
      },
      {
        body: IamSchema.Role.pick({
          code: true,
          name: true,
          isSystem: true,
        }),
        response: zResponse.ok(IamSchema.Role),
      }
    )
    .put(
      '/update',
      async function updateRole({ body }) {
        const role = await s.roles.update(body.id, body)
        return res.ok(role, 'ROLE_UPDATED')
      },
      {
        body: IamSchema.Role.pick({
          id: true,
          code: true,
          name: true,
          isSystem: true,
        }),
        response: zResponse.ok(IamSchema.Role),
      }
    )
    .delete(
      '/delete',
      async function deleteRole({ body }) {
        await s.roles.delete(body.id)
        return res.ok({ id: body.id }, 'ROLE_DELETED')
      },
      {
        body: IamSchema.Role.pick({ id: true }),
        response: zResponse.ok(IamSchema.Role.pick({ id: true })),
      }
    )
}
