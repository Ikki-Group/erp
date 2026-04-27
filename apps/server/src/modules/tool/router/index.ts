import Elysia from 'elysia'

import type { ToolServiceModule } from '../service'
import { initSeedRoute } from './seed.route'

export function initToolRouteModule(service: ToolServiceModule) {
	const seedRouter = initSeedRoute(service.seed)

	return new Elysia({ prefix: '/tool' }).use(seedRouter)
}
