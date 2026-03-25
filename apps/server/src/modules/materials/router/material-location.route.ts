import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-plugin'
import { res } from '@/core/http/response'
import { zHttp, zResponse, zSchema } from '@/core/validation'

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
          response: zResponse.ok(z.object({ assignedCount: z.number() })),
          auth: true,
          detail: { tags: ['Material Location'] },
        }
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
          response: zResponse.ok(zSchema.recordId),
          auth: true,
          detail: { tags: ['Material Location'] },
        }
      )

      /* ─────── List locations assigned to a material ─────── */
      .get(
        '/by-material',
        async function byMaterial({ query }) {
          const data = await s.mLocation.handleLocationsByMaterial(query.id)
          return res.ok(data)
        },
        {
          query: zHttp.recordId,
          response: zResponse.ok(MaterialLocationWithLocationDto.array()),
          auth: true,
          detail: { tags: ['Material Location'] },
        }
      )

      /* ─────── Stock list: materials at a specific location (paginated) ─────── */
      .get(
        '/stock',
        async function stock({ query }) {
          const result = await s.mLocation.handleStockByLocation(query, query)
          return res.paginated(result)
        },
        {
          query: z.object({
            ...zHttp.pagination.shape,
            ...MaterialLocationFilterDto.shape,
          }),
          response: zResponse.paginated(MaterialLocationStockDto.array()),
          auth: true,
          detail: { tags: ['Material Location'] },
        }
      )

      /* ─────── Update per-location config ─────── */
      .put(
        '/config',
        async function config({ body, auth }) {
          const result = await s.mLocation.handleUpdateConfig(body, auth.userId)
          return res.ok(result)
        },
        {
          body: MaterialLocationConfigDto,
          response: zResponse.ok(zSchema.recordId),
          auth: true,
          detail: { tags: ['Material Location'] },
        }
      )
  )
}
