import Elysia from 'elysia'
import z from 'zod'

// import { UserCreateDto, UserDetailDto, UserDto, UserUpdateDto } from '../schema'
import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse } from '@/lib/validation'

import { UserMutationDto, UserSelectDto } from '../dto'
import type { IamServiceModule } from '../service'

export function initUserRoute(s: IamServiceModule) {
  return (
    new Elysia()
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
      // .get(
      //   '/detail',
      //   async function detail({ query }) {
      //     const user = await s.user.findDetailById(query.id)
      //     return res.ok(user)
      //   },
      //   {
      //     query: z.object({ id: zHttp.query.idRequired }),
      //     response: zResponse.ok(UserDetailDto),
      //     auth: true,
      //   }
      // )
      .post(
        '/create',
        async function create({ body }) {
          const { id } = await s.user.handleCreate(body)
          return res.created({ id }, 'USER_CREATED')
        },
        {
          body: UserMutationDto,
          response: zHttp.ok(zHttp.recordId),
          auth: true,
        }
      )
  )
  // .put(
  //   '/update',
  //   async function update({ body }) {
  //     const { id } = await s.user.update(body.id, body)
  //     return res.ok({ id }, 'USER_UPDATED')
  //   },
  //   {
  //     body: UserUpdateDto,
  //     response: zResponse.ok(zSchema.recordId),
  //     auth: true,
  //   }
  // )
  // .delete(
  //   '/delete',
  //   async function remove({ body }) {
  //     await s.user.delete(body.id)
  //     return res.ok({ id: body.id }, 'USER_DELETED')
  //   },
  //   {
  //     body: z.object({ id: zHttp.query.idRequired }),
  //     response: zResponse.ok(zSchema.recordId),
  //     auth: true,
  //   }
  // )
}
