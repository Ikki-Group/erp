import { endpoint } from '@/config/endpoint.ts'
import { defineResource } from '@/lib/api/index.ts'

import { LocationCreateDto, LocationDto, LocationFilterDto, LocationUpdateDto } from './dto/index.ts'

export const locationResource = defineResource({
	urls: endpoint.location,
	entitySchema: LocationDto,
	filter: LocationFilterDto,
	create: LocationCreateDto,
	update: LocationUpdateDto,
})
