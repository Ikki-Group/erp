import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import { ShiftRepo } from './shift.repo.ts'
import { createShiftRoute } from './shift.route.ts'
import { ShiftService } from './shift.service.ts'

// ─── Dependencies ───

export interface ShiftModuleDeps {
	locationService: LocationService
}

// ─── Module Factory ───

export function createShiftModule(db: DbContext, cacheClient: CacheClient, deps: ShiftModuleDeps) {
	const repo = new ShiftRepo(db)
	const service = new ShiftService(repo, cacheClient, deps.locationService)
	const route = createShiftRoute(service)
	return { route, service }
}
