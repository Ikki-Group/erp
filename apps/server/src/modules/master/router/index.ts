import Elysia from 'elysia'

import type { MasterServiceModule } from '../service'
import { initMasterUomRouter } from './master-uom.router'

export function initMasterRouteModule(svc: MasterServiceModule) {
  const masterRouter = initMasterUomRouter(svc)

  return new Elysia({ prefix: '/master', tags: ['master'] }).group('', (g) => g.use(masterRouter))
}
