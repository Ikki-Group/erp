import Elysia from 'elysia'
import z from 'zod'

import { PaginationQuery } from '@/lib/pagination'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamSchema } from '../iam.schema'
import type { IamServiceModule } from '../service'

export function initIamRoleRoute(service: IamServiceModule) {
  return new Elysia()
    .get(
      '/list',
      async function listPaginated({ query }) {
        const { isSystem, search, page, limit } = query
        const result = await service.roles.listPaginated({ isSystem, search }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...PaginationQuery.shape,
          search: zSchema.query.search,
          isSystem: zSchema.query.boolean,
        }),
        response: zResponse.paginated(IamSchema.Role.array()),
      }
    )
    .get(
      '/detail',
      async function getRoleById({ query }) {
        const role = await service.roles.getById(query.id)
        return res.ok(role)
      },
      {
        query: z.object({ id: zSchema.query.idRequired }),
        response: zResponse.ok(IamSchema.Role),
      }
    )
    .post(
      '/create',
      async function createRole({ body }) {
        const role = await service.roles.create(body)
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
        const role = await service.roles.update(body.id, body)
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
        await service.roles.delete(body.id)
        return res.ok({ id: body.id }, 'ROLE_DELETED')
      },
      {
        body: IamSchema.Role.pick({ id: true }),
        response: zResponse.ok(IamSchema.Role.pick({ id: true })),
      }
    )
}
