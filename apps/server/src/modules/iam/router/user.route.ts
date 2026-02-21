import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse, zSchema } from '@/lib/validation'

import { UserCreateDto, UserDetailDto, UserDto, UserUpdateDto } from '../schema'
import type { IamServiceModule } from '../service'

export function initUserRoute(s: IamServiceModule) {
  return new Elysia()
    .get(
      '/list',
      async function list({ query }) {
        const { isActive, search, page, limit } = query
        const result = await s.user.findPaginated({ isActive, search }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
          isActive: zHttp.query.boolean,
        }),
        response: zResponse.paginated(UserDto.array()),
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const user = await s.user.findDetailById(query.id)
        return res.ok(user)
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(UserDetailDto),
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { id } = await s.user.create(body)
        return res.created({ id }, 'USER_CREATED')
      },
      {
        body: UserCreateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { id } = await s.user.update(body.id, body)
        return res.ok({ id }, 'USER_UPDATED')
      },
      {
        body: UserUpdateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
    .delete(
      '/delete',
      async function remove({ body }) {
        await s.user.delete(body.id)
        return res.ok({ id: body.id }, 'USER_DELETED')
      },
      {
        body: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(zSchema.recordId),
      }
    )
}
