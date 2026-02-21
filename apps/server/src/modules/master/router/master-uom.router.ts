import Elysia from 'elysia'
import z from 'zod'

import { zHttp } from '@/lib/validation'

import type { MasterServiceModule } from '../service'

export function initMasterUomRouter(svc: MasterServiceModule) {
  return new Elysia({ prefix: '/uom' }).get(
    '/',
    async ({ query }) => {
      const { code, page, limit } = query
      const { data, meta } = await svc.uom.listPaginated({ code }, { page, limit })
      return { data, meta }
    },
    {
      query: z.object({
        ...zHttp.pagination.shape,
        code: zHttp.query.search,
      }),
    }
  )
}
