import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { SupplierService } from '@/modules/supplier/supplier.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { createInventoryRoute } from './inventory.route.ts'
import { createOpnameModule } from './opname/opname.module.ts'
import { createReceivingModule } from './receiving/receiving.module.ts'
import { createStockModule } from './stock/stock.module.ts'
import type { StockService } from './stock/stock.service.ts'
import { createTransferModule } from './transfer/transfer.module.ts'

// ─── Dependencies ───

export interface InventoryModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	assignmentService: AssignmentService
	locationService: LocationService
	materialService: MaterialService
	supplierService: SupplierService
	uomService: UomService
}

export type InventoryStockApi = Pick<
	StockService,
	'recordMovement' | 'getBalance' | 'handleGetBalance' | 'invalidateCache'
>

export interface InventoryApi extends Record<string, unknown> {
	stock: InventoryStockApi
}

// ─── Module Factory ───

export function createInventoryModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: InventoryModuleDeps,
) {
	const stock = createStockModule(db, cacheClient, {
		assignmentService: deps.assignmentService,
		events: deps.events,
	})
	const transfer = createTransferModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		events: deps.events,
		stockService: stock.service,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const receiving = createReceivingModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		events: deps.events,
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
		events: deps.events,
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
	return {
		route,
		api,
		stockService: stock.service,
		transferService: transfer.service,
		receivingService: receiving.service,
		opnameService: opname.service,
	}
}
