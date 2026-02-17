import Elysia from 'elysia'
import z from 'zod'

import { zSchema } from '@/lib/zod'

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
        ...zSchema.pagination.shape,
        code: zSchema.query.search,
      }),
    }
  )
}
