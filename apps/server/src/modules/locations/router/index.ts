import Elysia from 'elysia'

import type { LocationServiceModule } from '../service'
import { initLocationRoute } from './locations.route'

export function initLocationsRouteModule(s: LocationServiceModule) {
  const locationRouter = initLocationRoute(s.locations)

  return new Elysia({ prefix: '/locations', tags: ['locations'] }).group('', (g) => g.use(locationRouter))
}
