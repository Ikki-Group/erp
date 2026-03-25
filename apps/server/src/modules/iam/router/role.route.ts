import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-plugin'
import { res } from '@/core/http/response'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/core/validation'

import { RoleCreateDto, RoleDto, RoleUpdateDto } from '../dto'
import type { IamServiceModule } from '../service'

export function initRoleRoute(s: IamServiceModule) {
  return new Elysia({ prefix: '/role' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.role.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({ ...zHttp.pagination.shape, search: zHttp.query.search }),
        response: zResponse.paginated(RoleDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const role = await s.role.handleDetail(query.id)
        return res.ok(role)
      },
      { query: zHttp.recordId, response: zResponse.ok(RoleDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await s.role.handleCreate(body, auth.userId)
        return res.created(result, 'ROLE_CREATED')
      },
      { body: RoleCreateDto, response: zResponse.ok(zSchema.recordId), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const result = await s.role.handleUpdate(body.id, body, auth.userId)
        return res.ok(result, 'ROLE_UPDATED')
      },
      { body: RoleUpdateDto.extend({ id: zPrimitive.id }), response: zResponse.ok(zSchema.recordId), auth: true },
    )
    .delete(
      '/delete',
      async function remove({ body }) {
        const result = await s.role.handleRemove(body.id)
        return res.ok(result, 'ROLE_DELETED')
      },
      { body: zSchema.recordId, response: zResponse.ok(zSchema.recordId), auth: true },
    )
}
