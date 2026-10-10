import type { Infra } from '@/shared/module.ts'

import { LocationRepo } from './location.repo.ts'
import { createLocationRoute } from './location.route.ts'
import { LocationService } from './location.service.ts'

export function createLocationModule(infra: Infra) {
	const service = new LocationService({ ...infra, repo: new LocationRepo(infra.db) })
	return { service, route: createLocationRoute(service) }
}

export type { LocationService }
export { LocationDto, LocationTypeEnum } from '@ikki/contract/location'
