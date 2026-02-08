import Elysia from 'elysia'

import type { LocationsModuleService } from '../service'
import { buildLocationRoute } from './locations.route'

export function buildLocationsRoute(s: LocationsModuleService) {
  const locationRouter = buildLocationRoute(s.locations)

  return new Elysia({ prefix: '/locations', tags: ['locations'] }).group('', (g) => g.use(locationRouter))
}
