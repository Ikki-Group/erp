import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { RoleCreateDto, RoleDto, RoleUpdateDto, RoleFilterDto } from '../dto'
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
        query: z.object({ ...RoleFilterDto.shape, ...zPaginationDto.shape }),
        response: createPaginatedResponseSchema(RoleDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const role = await s.role.handleDetail(query.id)
        return res.ok(role)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(RoleDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await s.role.handleCreate(body, auth.userId)
        return res.created(result, 'ROLE_CREATED')
      },
      { body: RoleCreateDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const result = await s.role.handleUpdate(body.id, body, auth.userId)
        return res.ok(result, 'ROLE_UPDATED')
      },
      {
        body: z.object({ id: zId, ...RoleUpdateDto.shape }),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ body, auth }) {
        const result = await s.role.handleRemove(body.id, auth.userId)
        return res.ok(result, 'ROLE_DELETED')
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ body }) {
        const result = await s.role.handleHardRemove(body.id)
        return res.ok(result, 'ROLE_HARD_DELETED')
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}
