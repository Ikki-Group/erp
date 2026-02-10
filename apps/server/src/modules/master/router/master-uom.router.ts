import Elysia from 'elysia'

import type { MasterServiceModule } from '../service'

export function initMasterUomRouter(svc: MasterServiceModule) {
  return new Elysia({ prefix: '/uom' }).get('/', async ({ query }) => {
    const { data, meta } = await svc.uom.listPaginated(query, {
      page: query.page,
      limit: query.limit,
    })
    return { data, meta }
  })
}
