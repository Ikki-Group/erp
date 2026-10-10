import type { Infra } from '@/shared/module.ts'

import type { StockService } from '@/modules/inventory/index.ts'
import type { LocationService } from '@/modules/location/index.ts'
import type { MaterialService } from '@/modules/material/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import { ProductionRepo } from './production.repo.ts'
import { createProductionRoute } from './production.route.ts'
import { ProductionService } from './production.service.ts'

export function createProductionModule(
	infra: Infra,
	deps: {
		stock: Pick<StockService, 'recordMovement' | 'getBalance'>
		location: Pick<LocationService, 'handleGetById'>
		material: Pick<MaterialService, 'handleGetById'>
		uom: Pick<UomService, 'getAllConversions'>
	},
) {
	const service = new ProductionService({ ...infra, ...deps, repo: new ProductionRepo(infra.db) })
	return { route: createProductionRoute(service) }
}
