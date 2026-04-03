import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zId, zRecordIdDto } from '@/core/validation'

import { zCreateLocationDto, zFilterLocationDto, zLocationDto, zUpdateLocationDto } from '../dto/location.dto'
import type { LocationService } from '../service/location.service'

/**
 * Location request handlers.
 */
class LocationHandler {
  constructor(private service: LocationService) {}

  /**
   * Paginated list.
   * @param {any} context - router ctx.
   * @returns {Promise<any>} response.
   */
  async list({ query }: { query: any }): Promise<any> {
    const result = await this.service.handleList(query)
    return res.paginated(result)
  }

  /**
   * Single detail.
   * @param {any} context - router ctx.
   * @returns {Promise<any>} response.
   */
  async detail({ query }: { query: { id: string } }): Promise<any> {
    const result = await this.service.handleDetail(query.id)
    return res.ok(result)
  }

  /**
   * Creation.
   * @param {any} context - router ctx.
   * @returns {Promise<any>} response.
   */
  async create({ body, auth }: { body: any; auth: { userId: string } }): Promise<any> {
    const result = await this.service.handleCreate(body, auth.userId)
    return res.created(result)
  }

  /**
   * Modification.
   * @param {any} context - router ctx.
   * @returns {Promise<any>} response.
   */
  async update({ body, auth }: { body: any; auth: { userId: string } }): Promise<any> {
    const { id, ...data } = body
    const result = await this.service.handleUpdate(id, data, auth.userId)
    return res.ok(result, 'LOCATION_UPDATED')
  }

  /**
   * Removal.
   * @param {any} context - router ctx.
   * @returns {Promise<any>} response.
   */
  async remove({ body, auth }: { body: { id: string }; auth: { userId: string } }): Promise<any> {
    const result = await this.service.handleRemove(body.id, auth.userId)
    return res.ok(result)
  }

  /**
   * Permanent removal.
   * @param {any} context - router ctx.
   * @returns {Promise<any>} response.
   */
  async hardRemove({ body }: { body: { id: string } }): Promise<any> {
    const result = await this.service.handleHardRemove(body.id)
    return res.ok(result)
  }
}

/**
 * Location Routes (Layer 1)
 *
 * Exposes Location Management endpoints.
 * @param {LocationService} service - The location service instance.
 * @returns {Elysia} The elysia router.
 */
export function initLocationRoute(service: LocationService) {
  const h = new LocationHandler(service)
  // Use chained router to ensure correct name binding
  const router = new Elysia({ name: 'location' }).use(authPluginMacro)

  // -- Queries --
  router.get('/list', (ctx) => h.list(ctx), {
    query: zFilterLocationDto,
    response: createPaginatedResponseSchema(zLocationDto),
    auth: true,
  })

  router.get('/detail', (ctx) => h.detail(ctx), {
    query: zRecordIdDto,
    response: createSuccessResponseSchema(zLocationDto),
    auth: true,
  })

  // -- Mutations --
  router.post('/create', (ctx) => h.create(ctx), {
    body: zCreateLocationDto,
    response: createSuccessResponseSchema(zRecordIdDto),
    auth: true,
  })

  router.patch('/update', (ctx) => h.update(ctx), {
    body: zUpdateLocationDto.extend({ id: zId }),
    response: createSuccessResponseSchema(zRecordIdDto),
    auth: true,
  })

  router.delete('/remove', (ctx) => h.remove(ctx), {
    body: zRecordIdDto,
    response: createSuccessResponseSchema(zRecordIdDto),
    auth: true,
  })

  router.delete('/hard-remove', (ctx) => h.hardRemove(ctx), {
    body: zRecordIdDto,
    response: createSuccessResponseSchema(zRecordIdDto),
    auth: true,
  })

  return router
}
