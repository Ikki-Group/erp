import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/lib/validation'

import { RoleDto, RoleMutationDto } from '../dto'
import type { IamServiceModule } from '../service'

export function initRoleRoute(s: IamServiceModule) {
  return new Elysia({ prefix: '/role' })
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.role.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
        }),
        response: zResponse.paginated(RoleDto.array()),
        auth: true,
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const role = await s.role.handleDetail(query.id)
        return res.ok(role)
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(RoleDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const result = await s.role.handleCreate(body)
        return res.created(result, 'ROLE_CREATED')
      },
      {
        body: RoleMutationDto,
        response: zHttp.ok(zHttp.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const result = await s.role.handleUpdate(body.id, body)
        return res.ok(result, 'ROLE_UPDATED')
      },
      {
        body: z.object({
          id: zPrimitive.objId,
          ...RoleMutationDto.partial().shape,
        }),
        response: zHttp.ok(zHttp.recordId),
        auth: true,
      }
    )
    .delete(
      '/delete',
      async function remove({ body }) {
        const result = await s.role.handleRemove(body.id)
        return res.ok(result, 'ROLE_DELETED')
      },
      {
        body: zSchema.recordId,
        response: zHttp.ok(zHttp.recordId),
        auth: true,
      }
    )
}
