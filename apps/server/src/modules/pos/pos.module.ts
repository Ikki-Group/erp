import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import { createTableModule } from './table/table.module.ts'

// ─── Dependencies ───

export interface PosModuleDeps {
	locationService: LocationService
}

// ─── Module Factory ───

export function createPosModule(db: DbContext, cacheClient: CacheClient, deps: PosModuleDeps) {
	const table = createTableModule(db, cacheClient, { locationService: deps.locationService })

	const route = new Elysia({ prefix: '/pos' })
		.use(table.route)

	return { route, tableService: table.service }
}
