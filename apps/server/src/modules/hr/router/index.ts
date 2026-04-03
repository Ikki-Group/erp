import Elysia from 'elysia'

import type { HRServiceModule } from '../service'
import { initHRRoute } from './hr.route'

export function initHRRouteModule(service: HRServiceModule) {
  const hrRouter = initHRRoute(service.hr)

  return new Elysia({ prefix: '/hr' }).use(hrRouter)
}
