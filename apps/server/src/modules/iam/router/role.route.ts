import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamSchema } from '../iam.types'
import type { IamRolesService } from '../service/roles.service'

export function roleRoute(s: IamRolesService) {
  return new Elysia()
    .get(
      '/list',
      async function getRoles({ query }) {
        const result = await s.list(query)
        return res.paginated(result)
      },
      {
        query: zSchema.pagination.extend({
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
        const role = await s.getById(query.id)
        return res.ok(role)
      },
      {
        query: z.object({
          id: zSchema.numCoerce,
        }),
        response: zResponse.ok(IamSchema.Role),
      }
    )
    .post(
      '/create',
      async function createRole({ body }) {
        const role = await s.create(body)
        return res.created(role, 'ROLE_CREATED')
      },
      {
        body: z.object({
          ...IamSchema.Role.pick({
            code: true,
            name: true,
            isSystem: true,
          }).shape,
        }),
        response: zResponse.ok(IamSchema.Role),
      }
    )
    .put(
      '/update',
      async function updateRole({ body }) {
        const role = await s.update(body.id, body)
        return res.ok(role, 'ROLE_UPDATED')
      },
      {
        body: z.object({
          id: zSchema.num,
          ...IamSchema.Role.pick({
            code: true,
            name: true,
            isSystem: true,
          }).shape,
        }),
        response: zResponse.ok(IamSchema.Role),
      }
    )
    .delete(
      '/delete',
      async function deleteRole({ body }) {
        await s.delete(body.id)
        return res.ok({ id: body.id }, 'ROLE_DELETED')
      },
      {
        body: z.object({ id: zSchema.num }),
        response: zResponse.ok(
          z.object({
            id: zSchema.num,
          })
        ),
      }
    )
}
