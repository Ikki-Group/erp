import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { ForbiddenError } from '@/lib/error/http'
import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/lib/validation'

import { UserAdminUpdatePasswordDto, UserChangePasswordDto, UserCreateDto, UserSelectDto, UserUpdateDto } from '../dto'
import type { IamServiceModule } from '../service'

export function initUserRoute(s: IamServiceModule) {
  return new Elysia({ prefix: '/user' })
    .use(authPluginMacro)
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
        response: zResponse.ok(UserSelectDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await s.user.handleCreate(body, auth.userId)
        return res.created(result, 'USER_CREATED')
      },
      {
        body: UserCreateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const result = await s.user.handleUpdate(body.id, body, auth.userId)
        return res.ok(result, 'USER_UPDATED')
      },
      {
        body: z.object({
          id: zPrimitive.id,
          ...UserUpdateDto.shape,
        }),
        response: zResponse.ok(zSchema.recordId),
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
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/change-password',
      async function changePassword({ body, auth }) {
        const result = await s.user.handleChangePassword(auth.userId, body)
        return res.ok(result, 'USER_PASSWORD_CHANGED')
      },
      {
        body: UserChangePasswordDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/admin-update-password',
      async function adminUpdatePassword({ body, auth }) {
        if (!auth.user?.isRoot) throw new ForbiddenError('Forbidden', 'AUTH_FORBIDDEN')
        const result = await s.user.handleAdminUpdatePassword(auth.userId, body)
        return res.ok(result, 'USER_PASSWORD_UPDATED_BY_ADMIN')
      },
      {
        body: UserAdminUpdatePasswordDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}
