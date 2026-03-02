import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/lib/validation'

import { UserDetailDto, UserMutationDto, UserSelectDto } from '../dto'
import type { IamServiceModule } from '../service'

export function initUserRoute(s: IamServiceModule) {
  return new Elysia({ prefix: '/user' })
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.user.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
          isActive: zHttp.query.boolean,
        }),
        response: zResponse.paginated(UserSelectDto.array()),
        auth: true,
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const user = await s.user.handleDetail(query.id)
        return res.ok(user)
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(UserDetailDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const result = await s.user.handleCreate(body)
        return res.created(result, 'USER_CREATED')
      },
      {
        body: UserMutationDto,
        response: zHttp.ok(zHttp.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const result = await s.user.handleUpdate(body.id, body)
        return res.ok(result, 'USER_UPDATED')
      },
      {
        body: z.object({
          id: zPrimitive.objId,
          ...UserMutationDto.shape,
        }),
        response: zHttp.ok(zHttp.recordId),
        auth: true,
      }
    )
    .delete(
      '/delete',
      async function remove({ body }) {
        const result = await s.user.handleRemove(body.id)
        return res.ok(result, 'USER_DELETED')
      },
      {
        body: zSchema.recordId,
        response: zHttp.ok(zHttp.recordId),
        auth: true,
      }
    )
}
