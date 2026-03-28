import { Elysia } from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { ForbiddenError } from '@/core/http/errors'
import { res } from '@/core/http/response'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import {
  UserAdminUpdatePasswordDto,
  UserChangePasswordDto,
  UserCreateDto,
  UserOutputDto,
  UserUpdateDto,
  UserFilterDto,
} from '../dto'
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
        query: z.object({ ...UserFilterDto.shape, ...zPaginationDto.shape }),
        response: createPaginatedResponseSchema(UserOutputDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const user = await s.user.handleDetail(query.id)
        return res.ok(user)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(UserOutputDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await s.user.handleCreate(body, auth.userId)
        return res.created(result, 'USER_CREATED')
      },
      { body: UserCreateDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const result = await s.user.handleUpdate(body.id, body, auth.userId)
        return res.ok(result, 'USER_UPDATED')
      },
      {
        body: z.object({ id: zId, ...UserUpdateDto.shape }),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ body, auth }) {
        const result = await s.user.handleRemove(body.id, auth.userId)
        return res.ok(result, 'USER_DELETED')
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ body }) {
        const result = await s.user.handleHardRemove(body.id)
        return res.ok(result, 'USER_HARD_DELETED')
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/change-password',
      async function changePassword({ body, auth }) {
        const result = await s.user.handleChangePassword(auth.userId, body)
        return res.ok(result, 'USER_PASSWORD_CHANGED')
      },
      { body: UserChangePasswordDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/admin-update-password',
      async function adminUpdatePassword({ body, auth }) {
        if (!auth.user?.isRoot) throw new ForbiddenError('Forbidden', 'AUTH_FORBIDDEN')
        const result = await s.user.handleAdminUpdatePassword(auth.userId, body)
        return res.ok(result, 'USER_PASSWORD_UPDATED_BY_ADMIN')
      },
      { body: UserAdminUpdatePasswordDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}
