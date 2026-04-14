import Elysia from 'elysia'

import type { LocationServiceModule } from '../service'
import { initLocationRoute } from './location.route'

export function initLocationRouteModule(service: LocationServiceModule) {
	const locationRouter = initLocationRoute(service.location)

	return new Elysia({ prefix: '/location' }).use(locationRouter)
}
