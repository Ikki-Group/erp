import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { LocationApi } from '@/modules/location/index.ts'
import type { MaterialApi } from '@/modules/material/index.ts'
import type { SupplierApi } from '@/modules/supplier/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

import { createInventoryRoute } from './inventory.route.ts'
import { createOpnameModule } from './opname/opname.module.ts'
import { createReceivingModule } from './receiving/receiving.module.ts'
import { createStockModule } from './stock/stock.module.ts'
import type { StockService } from './stock/stock.service.ts'
import { createTransferModule } from './transfer/transfer.module.ts'

// ─── Dependencies ───

interface InventoryModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	assignmentService: MaterialApi['assignmentService']
	locationService: LocationApi['service']
	materialService: MaterialApi['service']
	supplierService: SupplierApi['service']
	uomService: UomApi['service']
}

type InventoryStockApi = Pick<
	StockService,
	'recordMovement' | 'getBalance' | 'handleGetBalance' | 'invalidateCache'
>

export interface InventoryApi extends Record<string, unknown> {
	stock: InventoryStockApi
}

// ─── Module Factory ───

function createInventoryModule(db: DbContext, cacheClient: CacheClient, deps: InventoryModuleDeps) {
	const stock = createStockModule(db, cacheClient, {
		assignmentService: deps.assignmentService,
	})
	const transfer = createTransferModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		stockService: stock.service,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const receiving = createReceivingModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		stockService: stock.service,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
		materialService: deps.materialService,
		supplierService: deps.supplierService,
		uomService: deps.uomService,
	})
	const opname = createOpnameModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		stockService: stock.service,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const route = createInventoryRoute({ stock, transfer, receiving, opname })
	const api: InventoryApi = {
		stock: {
			recordMovement: stock.service.recordMovement.bind(stock.service),
			getBalance: stock.service.getBalance.bind(stock.service),
			handleGetBalance: stock.service.handleGetBalance.bind(stock.service),
			invalidateCache: stock.service.invalidateCache.bind(stock.service),
		},
	}
	return { route, api }
}

// ─── Descriptor ───

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	return typeof api?.getById === 'function' && typeof api.service === 'object'
}

function isMaterialApi(api: Record<string, unknown> | undefined): api is MaterialApi {
	return typeof api?.service === 'object' && typeof api.assignmentService === 'object'
}

function isSupplierApi(api: Record<string, unknown> | undefined): api is SupplierApi {
	return typeof api?.service === 'object' && typeof api.getById === 'function'
}

function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	return typeof api?.service === 'object' && typeof api.getAllConversions === 'function'
}

export const inventoryModule: ModuleDescriptor = {
	name: 'inventory',
	layer: 2,
	dependsOn: ['location', 'material', 'supplier', 'uom'],
	create(ctx, deps) {
		const location = deps.location?.api
		const material = deps.material?.api
		const supplier = deps.supplier?.api
		const uom = deps.uom?.api
		if (
			!isLocationApi(location) ||
			!isMaterialApi(material) ||
			!isSupplierApi(supplier) ||
			!isUomApi(uom)
		)
			throw new Error('Inventory dependencies are missing')
		return createInventoryModule(ctx.db, ctx.cacheClient, {
			uow: ctx.uow,
			audit: ctx.auditPort,
			assignmentService: material.assignmentService,
			locationService: location.service,
			materialService: material.service,
			supplierService: supplier.service,
			uomService: uom.service,
		})
	},
}
