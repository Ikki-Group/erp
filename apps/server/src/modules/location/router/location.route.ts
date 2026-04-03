import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zRecordIdDto } from '@/core/validation'

import * as dto from '../dto/location.dto'
import type { LocationService } from '../service/location.service'

class LocationHandler {
  constructor(private service: LocationService) {}

  async list({ query }: { query: dto.LocationFilterDto }) {
    const result = await this.service.handleList(query)
    return res.paginated(result)
  }

  async detail({ query }: { query: z.infer<typeof zRecordIdDto> }) {
    const result = await this.service.handleDetail(query.id)
    return res.ok(result)
  }

  async create({ body, auth }: { body: dto.LocationCreateDto; auth: { userId: number } }) {
    const result = await this.service.handleCreate(body, auth.userId)
    return res.ok(result)
  }

  async update({ body, auth }: { body: dto.LocationUpdateDto; auth: { userId: number } }) {
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

export function initLocationRoute(service: LocationService) {
  const h = new LocationHandler(service)

  return new Elysia({ name: 'location' })
    .use(authPluginMacro)
    .get('/list', h.list.bind(h), {
      query: dto.LocationFilterDto,
      response: createPaginatedResponseSchema(dto.LocationDto),
      auth: true,
    })
    .get('/detail', h.detail.bind(h), {
      query: zRecordIdDto,
      response: createSuccessResponseSchema(dto.LocationDto),
      auth: true,
    })
    .post('/create', h.create.bind(h), {
      body: dto.LocationCreateDto,
      response: createSuccessResponseSchema(zRecordIdDto),
      auth: true,
    })
    .patch('/update', h.update.bind(h), {
      body: dto.LocationUpdateDto,
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
