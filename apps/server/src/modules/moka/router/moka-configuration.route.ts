import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { MokaConfigurationCreateDto, MokaConfigurationOutputDto, MokaConfigurationUpdateDto } from '../dto'
import type { MokaConfigurationService } from '../service/moka-configuration.service'

export function initMokaConfigurationRoute(service: MokaConfigurationService) {
  return new Elysia({ prefix: '/config' })
    .use(authPluginMacro)
    .get(
      '/by-location/:locationId',
      async function findByLocationId({ params }) {
        const result = await service.findByLocationId(params.locationId)
        if (!result) return res.ok(null)
        return res.ok(MokaConfigurationOutputDto.parse(result))
      },
      { params: z.object({ locationId: z.string() }), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await service.handleCreate(body, auth.userId)
        return res.created(result)
      },
      { body: MokaConfigurationCreateDto, auth: true },
    )
    .put(
      '/update/:id',
      async function update({ params, body, auth }) {
        const result = await service.handleUpdate(params.id, body, auth.userId)
        return res.ok(result)
      },
      { params: z.object({ id: z.string() }), body: MokaConfigurationUpdateDto, auth: true },
    )
}
