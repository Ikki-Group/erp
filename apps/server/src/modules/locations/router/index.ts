import Elysia from 'elysia'

import type { LocationServiceModule } from '../service'
import { initLocationRoute } from './locations.route'

export function initLocationsRouteModule(service: LocationServiceModule) {
  const locationRouter = initLocationRoute(service.locations)

  return new Elysia({ prefix: '/locations', tags: ['locations'] }).group('', (g) => g.use(locationRouter))
}
