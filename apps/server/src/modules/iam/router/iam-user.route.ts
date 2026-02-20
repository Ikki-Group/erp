import Elysia from 'elysia'
import z from 'zod'

import { logger } from '@/lib/logger'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { UserCreateDto, UserDto, UserUpdateDto } from '../dto'
import type { IamServiceModule } from '../service'

export function initIamUserRoute(service: IamServiceModule) {
  return new Elysia()
    .get(
      '/list',
      async function getUsers({ query }) {
        const { isActive, search, page, limit } = query
        const result = await service.users.listPaginated({ isActive, search }, { page, limit })
        logger.withMetadata(result).debug('Users List Response')
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          search: zSchema.query.search,
          isActive: zSchema.query.boolean,
        }),
        response: zResponse.paginated(UserDto.array()),
      }
    )
    .get(
      '/detail',
      async function getUserById({ query }) {
        const user = await service.auth.getUserDetails(query.id)
        return res.ok(user)
      },
      {
        query: z.object({ id: zSchema.query.idRequired }),
      }
    )
    .post(
      '/create',
      async function createUser({ body }) {
        const user = await service.users.createWithRoles(body)
        return res.created(user, 'USER_CREATED')
      },
      {
        body: UserCreateDto,
      }
    )
    .put(
      '/update',
      async function updateUser({ body }) {
        const user = await service.users.updateWithRoles(body.id, body)
        return res.ok(user, 'USER_UPDATED')
      },
      {
        body: UserUpdateDto,
      }
    )
    .delete(
      '/delete',
      async function deleteUser({ body }) {
        await service.users.delete(body.id)
        return res.ok({ id: body.id }, 'USER_DELETED')
      },
      {
        body: z.object({ id: zSchema.query.idRequired }),
      }
    )
}
