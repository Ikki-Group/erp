import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { IamDto } from '../iam.dto'
import { UserSchema } from '../iam.types'
import type { IamUsersService } from '../service/users.service'

export function userRoute(s: IamUsersService) {
  return new Elysia()
    .get(
      '',
      async function getUsers({ query }) {
        const result = await s.list(query)
        return res.paginated(result)
      },
      {
        query: IamDto.ListUsers,
        response: zResponse.paginated(UserSchema.array()),
      }
    )
    .get(
      '/:id',
      async function getUserById({ params }) {
        const user = await s.getById(params.id)
        return res.ok(user)
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(UserSchema),
      }
    )
    .post(
      '',
      async function createUser({ body }) {
        const user = await s.create(body)
        return res.created(user, 'USER_CREATED')
      },
      {
        body: IamDto.CreateUser,
        response: zResponse.ok(UserSchema),
      }
    )
    .put(
      '/:id',
      async function updateUser({ params, body }) {
        const user = await s.update(params.id, body)
        return res.ok(user, 'USER_UPDATED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        body: IamDto.UpdateUser,
        response: zResponse.ok(UserSchema),
      }
    )
    .delete(
      '/:id',
      async function deleteUser({ params }) {
        await s.delete(params.id)
        return res.ok({ id: params.id }, 'USER_DELETED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(
          z.object({
            id: zSchema.num,
          })
        ),
      }
    )
    .patch(
      '/:id/toggle-active',
      async function toggleUserActive({ params }) {
        const user = await s.toggleActive(params.id)
        return res.ok(user, 'USER_STATUS_TOGGLED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(UserSchema),
      }
    )
}
