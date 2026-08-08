import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { ProductionRepo } from './production.repo.ts'
import { createProductionRoute } from './production.route.ts'
import { ProductionService } from './production.service.ts'

// ─── Dependencies ───

export interface ProductionModuleDeps {
	stockService: StockService
	locationService: LocationService
	materialService: MaterialService
	uomService: UomService
}

// ─── Module Factory ───

export function createProductionModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: ProductionModuleDeps,
) {
	const repo = new ProductionRepo(db)
	const service = new ProductionService(repo, cacheClient, {
		stockService: deps.stockService,
		locationService: deps.locationService,
		materialService: deps.materialService,
		uomService: deps.uomService,
	})
	const route = createProductionRoute(service)
	return { route, service }
}
