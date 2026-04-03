import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zRecordIdDto } from '@/core/validation'

import * as dto from '../dto/role.dto'
import type { RoleService } from '../service/role.service'

class RoleHandler {
  constructor(private service: RoleService) {}

  async list({ query }: { query: dto.RoleFilter }) {
    const result = await this.service.handleList(query)
    return res.paginated(result)
  }

  async detail({ query }: { query: z.infer<typeof zRecordIdDto> }) {
    const result = await this.service.handleDetail(query.id)
    return res.ok(result)
  }

  async create({ body, auth }: { body: dto.RoleCreate; auth: { userId: number } }) {
    const result = await this.service.handleCreate(body, auth.userId)
    return res.ok(result)
  }

  async update({ body, auth }: { body: dto.RoleUpdate; auth: { userId: number } }) {
    const { id, ...data } = body
    const result = await this.service.handleUpdate(id, data, auth.userId)
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

export function initRoleRoute(service: RoleService) {
  const h = new RoleHandler(service)

  return new Elysia({ name: 'iam.role' })
    .use(authPluginMacro)
    .get('/list', h.list.bind(h), {
      query: dto.RoleFilter,
      response: createPaginatedResponseSchema(dto.Role),
      auth: true,
    })
    .get('/detail', h.detail.bind(h), {
      query: zRecordIdDto,
      response: createSuccessResponseSchema(dto.Role),
      auth: true,
    })
    .post('/create', h.create.bind(h), {
      body: dto.RoleCreate,
      response: createSuccessResponseSchema(zRecordIdDto),
      auth: true,
    })
    .patch('/update', h.update.bind(h), {
      body: dto.RoleUpdate,
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
