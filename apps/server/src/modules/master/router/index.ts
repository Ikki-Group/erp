import Elysia from 'elysia'

import type { MasterServiceModule } from '../service'

import { initUomRoute } from './uom.route'

export function initMasterRouteModule(svc: MasterServiceModule) {
  const masterRouter = initUomRoute(svc.uom)

  return (
    new Elysia({ prefix: '/master', tags: ['master'] })
      //
      .group('', (g) => g.use(masterRouter))
  )
}
