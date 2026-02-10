import Elysia from 'elysia'

import type { MasterService } from '../service'

export function buildMasterUomRouter(svc: MasterService) {
  return new Elysia({ prefix: '/uom' }).get('/', async ({ query }) => {
    const { data, meta } = await svc.uom.listPaginated(query, {
      page: query.page,
      limit: query.limit,
    })
    return { data, meta }
  })
}
