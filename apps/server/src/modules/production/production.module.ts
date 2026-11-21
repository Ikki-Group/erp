import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { InventoryApi } from '@/modules/inventory/index.ts'
import type { LocationApi } from '@/modules/location/index.ts'
import type { MaterialApi } from '@/modules/material/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

import { ProductionRepo } from './production.repo.ts'
import { createProductionRoute } from './production.route.ts'
import { ProductionService } from './production.service.ts'

// ─── Dependencies ───

interface ProductionModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	inventoryApi: InventoryApi['stock']
	locationService: LocationApi['service']
	materialService: MaterialApi['service']
	uomService: UomApi['service']
}

// ─── Module Factory ───

function createProductionModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: ProductionModuleDeps,
) {
	const repo = new ProductionRepo(db)
	const service = new ProductionService(repo, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		inventoryApi: deps.inventoryApi,
		locationService: deps.locationService,
		materialService: deps.materialService,
		uomService: deps.uomService,
	})
	return { route: createProductionRoute(service) }
}

// ─── Descriptor ───

function isInventoryApi(api: Record<string, unknown> | undefined): api is InventoryApi {
	return typeof api?.stock === 'object'
}

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	return typeof api?.getById === 'function' && typeof api.service === 'object'
}

function isMaterialApi(api: Record<string, unknown> | undefined): api is MaterialApi {
	return typeof api?.service === 'object' && typeof api.assignmentService === 'object'
}

function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	return typeof api?.service === 'object' && typeof api.getAllConversions === 'function'
}

export const productionModule: ModuleDescriptor = {
	name: 'production',
	layer: 3,
	dependsOn: ['inventory', 'location', 'material', 'uom'],
	create(ctx, deps) {
		const inventory = deps.inventory?.api
		const location = deps.location?.api
		const material = deps.material?.api
		const uom = deps.uom?.api
		if (
			!isInventoryApi(inventory) ||
			!isLocationApi(location) ||
			!isMaterialApi(material) ||
			!isUomApi(uom)
		)
			throw new Error('Production dependencies are missing')
		return createProductionModule(ctx.db, ctx.cacheClient, {
			uow: ctx.uow,
			audit: ctx.auditPort,
			inventoryApi: inventory.stock,
			locationService: location.service,
			materialService: material.service,
			uomService: uom.service,
		})
	},
}
