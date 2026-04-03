import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
  createPaginatedResponseSchema,
  createSuccessResponseSchema,
  zRecordIdDto,
} from '@/core/validation'

import * as dto from '../dto/user.dto'
import type { UserService } from '../service/user.service'

/**
 * User Module Route (Layer 1)
 * Standard functional route pattern (Golden Path 2.1).
 */
export function initUserRoute(service: UserService) {
  return new Elysia({ prefix: '/user' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.handleList(query)
        return res.paginated(result)
      },
      {
        query: dto.UserFilterDto,
        response: createPaginatedResponseSchema(dto.UserDto),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const result = await service.handleDetail(query.id)
        return res.ok(result)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(dto.UserDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await service.handleCreate(body, auth.userId)
        return res.ok(result)
      },
      {
        body: dto.UserCreateDto,
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .patch(
      '/update',
      async function update({ body, auth }) {
        const { id, ...data } = body
        const result = await service.handleUpdate(id, data, auth.userId)
        return res.ok(result)
      },
      {
        body: dto.UserUpdateDto,
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .patch(
      '/admin/password-reset',
      async function adminUpdatePassword({ body, auth }) {
        const result = await service.handleAdminUpdatePassword(body, auth.userId)
        return res.ok(result)
      },
      {
        body: dto.UserAdminUpdatePasswordDto,
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ body, auth }) {
        const result = await service.handleRemove(body.id, auth.userId)
        return res.ok(result)
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ body }) {
        const result = await service.handleHardRemove(body.id)
        return res.ok(result)
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}
