import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zRecordIdDto } from '@/core/validation'

import * as dto from '../dto/user.dto'
import type { UserService } from '../service/user.service'

class UserHandler {
  constructor(private service: UserService) {}

  async list({ query }: { query: dto.UserFilter }) {
    const result = await this.service.handleList(query)
    return res.paginated(result)
  }

  async detail({ query }: { query: z.infer<typeof zRecordIdDto> }) {
    const result = await this.service.handleDetail(query.id)
    return res.ok(result)
  }

  async create({ body, auth }: { body: dto.UserCreate; auth: { userId: number } }) {
    const result = await this.service.handleCreate(body, auth.userId)
    return res.ok(result)
  }

  async update({ body, auth }: { body: dto.UserUpdate; auth: { userId: number } }) {
    const { id, ...data } = body
    const result = await this.service.handleUpdate(id, data, auth.userId)
    return res.ok(result)
  }

  async adminUpdatePassword({ body, auth }: { body: dto.UserAdminUpdatePassword; auth: { userId: number } }) {
    const result = await this.service.handleAdminUpdatePassword(body, auth.userId)
    return res.ok(result)
  }

  async remove({ body, auth }: { body: z.infer<typeof zRecordIdDto>; auth: { userId: number } }) {
    const result = await this.service.handleRemove(body.id, auth.userId)
    return res.ok(result)
  }

  async hardRemove({ body }: { body: z.infer<typeof zRecordIdDto> }) {
    const result = await this.service.handleHardRemove(body.id)
    return res.ok(result)
  }
}

export function initUserRoute(service: UserService) {
  const h = new UserHandler(service)

  return new Elysia({ name: 'iam.user' })
    .use(authPluginMacro)
    .get('/list', h.list.bind(h), {
      query: dto.UserFilter,
      response: createPaginatedResponseSchema(dto.User),
      auth: true,
    })
    .get('/detail', h.detail.bind(h), {
      query: zRecordIdDto,
      response: createSuccessResponseSchema(dto.User),
      auth: true,
    })
    .post('/create', h.create.bind(h), {
      body: dto.UserCreate,
      response: createSuccessResponseSchema(zRecordIdDto),
      auth: true,
    })
    .patch('/update', h.update.bind(h), {
      body: dto.UserUpdate,
      response: createSuccessResponseSchema(zRecordIdDto),
      auth: true,
    })
    .patch('/admin/password-reset', h.adminUpdatePassword.bind(h), {
      body: dto.UserAdminUpdatePassword,
      response: createSuccessResponseSchema(zRecordIdDto),
      auth: true,
    })
    .delete('/remove', h.remove.bind(h), {
      body: zRecordIdDto,
      response: createSuccessResponseSchema(zRecordIdDto),
      auth: true,
    })
    .delete('/hard-remove', h.hardRemove.bind(h), {
      body: zRecordIdDto,
      response: createSuccessResponseSchema(zRecordIdDto),
      auth: true,
    })
}
