import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse } from '@/lib/validation'

import { RoleDto, RoleMutationDto } from '../dto'
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
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
          isSystem: zHttp.query.boolean,
        }),
        response: zResponse.paginated(RoleDto.array()),
      }
    )
    .get(
      '/detail',
      async function getRoleById({ query }) {
        const role = await service.roles.getById(query.id)
        return res.ok(role)
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(RoleDto),
      }
    )
    .post(
      '/create',
      async function createRole({ body }) {
        const role = await service.roles.create(body)
        return res.created(role, 'ROLE_CREATED')
      },
      {
        body: RoleMutationDto,
        response: zResponse.ok(RoleDto),
      }
    )
    .put(
      '/update',
      async function updateRole({ body }) {
        const role = await service.roles.update(body.id, body)
        return res.ok(role, 'ROLE_UPDATED')
      },
      {
        body: z.object({
          id: zHttp.query.idRequired,
          ...RoleMutationDto.shape,
        }),
        response: zResponse.ok(RoleDto),
      }
    )
    .delete(
      '/delete',
      async function deleteRole({ body }) {
        await service.roles.delete(body.id)
        return res.ok({ id: body.id }, 'ROLE_DELETED')
      },
      {
        body: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(z.object({ id: zHttp.query.idRequired })),
      }
    )
}
