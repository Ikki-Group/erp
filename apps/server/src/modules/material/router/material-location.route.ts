import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import {
  MaterialLocationAssignDto,
  MaterialLocationConfigDto,
  MaterialLocationFilterDto,
  MaterialLocationStockDto,
  MaterialLocationUnassignDto,
  MaterialLocationWithLocationDto,
} from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialLocationRoute(s: MaterialServiceModule) {
  return (
    new Elysia({ prefix: '/location' })
      .use(authPluginMacro)

      /* ─────── Assign materials to a location (batch) ─────── */
      .post(
        '/assign',
        async function assign({ body, auth }) {
          const result = await s.mLocation.handleAssign(body, auth.userId)
          return res.ok(result)
        },
        {
          body: MaterialLocationAssignDto,
          response: createSuccessResponseSchema(z.object({ assignedCount: z.number() })),
          auth: true,
          detail: { tags: ['Material Location'] },
        },
      )

      /* ─────── Unassign a material from a location ─────── */
      .delete(
        '/unassign',
        async function unassign({ query }) {
          const result = await s.mLocation.handleUnassign(query)
          return res.ok(result)
        },
        {
          query: MaterialLocationUnassignDto,
          response: createSuccessResponseSchema(zRecordIdDto),
          auth: true,
          detail: { tags: ['Material Location'] },
        },
      )

      /* ─────── List locations assigned to a material ─────── */
      .get(
        '/by-material',
        async function byMaterial({ query }) {
          const data = await s.mLocation.handleLocationsByMaterial(query.id)
          return res.ok(data)
        },
        {
          query: zRecordIdDto,
          response: createSuccessResponseSchema(MaterialLocationWithLocationDto.array()),
          auth: true,
          detail: { tags: ['Material Location'] },
        },
      )

      /* ─────── Stock list: materials at a specific location (paginated) ─────── */
      .get(
        '/stock',
        async function stock({ query }) {
          const result = await s.mLocation.handleStockByLocation(query, query)
          return res.paginated(result)
        },
        {
          query: z.object({ ...MaterialLocationFilterDto.shape, ...zPaginationDto.shape }),
          response: createPaginatedResponseSchema(MaterialLocationStockDto),
          auth: true,
          detail: { tags: ['Material Location'] },
        },
      )

      /* ─────── Update per-location config ─────── */
      .patch(
        '/config',
        async function config({ body, auth }) {
          const result = await s.mLocation.handleUpdateConfig(body, auth.userId)
          return res.ok(result)
        },
        {
          body: MaterialLocationConfigDto,
          response: createSuccessResponseSchema(zRecordIdDto),
          auth: true,
          detail: { tags: ['Material Location'] },
        },
      )
  )
}
