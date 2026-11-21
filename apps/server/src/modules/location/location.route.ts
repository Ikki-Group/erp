import { crudRoutes } from '@/server/crud-route.ts'

import {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from './location.contract.ts'
import type { LocationService } from './location.service.ts'

export function createLocationRoute(service: LocationService) {
	return crudRoutes({
		prefix: '/location',
		resource: 'location',
		tag: 'Locations',
		entity: 'location',
		service,
		// `/detail` opens inactive locations too (the company overview links to them).
		detail: {
			response: LocationDto,
			handle: (id) => service.handleGetDetail(id),
		},
		schemas: {
			filter: LocationFilterDto,
			dto: LocationDto,
			create: LocationCreateDto,
			update: LocationUpdateDto,
		},
	})
}
