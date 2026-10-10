import { Elysia } from 'elysia'

import type { Infra } from '@/shared/module.ts'

import type { LocationService } from '@/modules/location/index.ts'
import type { MaterialAssignmentService, MaterialService } from '@/modules/material/index.ts'
import type { SupplierService } from '@/modules/supplier/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import { OpnameRepo } from './opname/opname.repo.ts'
import { createOpnameRoute } from './opname/opname.route.ts'
import { OpnameService } from './opname/opname.service.ts'
import { ReceivingRepo } from './receiving/receiving.repo.ts'
import { createReceivingRoute } from './receiving/receiving.route.ts'
import { ReceivingService } from './receiving/receiving.service.ts'
import { StockRepo } from './stock/stock.repo.ts'
import { createStockRoute } from './stock/stock.route.ts'
import { StockService } from './stock/stock.service.ts'
import { TransferRepo } from './transfer/transfer.repo.ts'
import { createTransferRoute } from './transfer/transfer.route.ts'
import { TransferService } from './transfer/transfer.service.ts'

export function createInventoryModule(
	infra: Infra,
	deps: {
		location: Pick<LocationService, 'handleGetById'>
		material: Pick<MaterialService, 'handleGetById'>
		materialAssignment: Pick<MaterialAssignmentService, 'isAssigned' | 'handleByLocation'>
		supplier: Pick<SupplierService, 'handleGetById'>
		uom: Pick<UomService, 'getAllConversions'>
	},
) {
	const { location, material, materialAssignment: assignment, supplier, uom } = deps
	const stockService = new StockService({ ...infra, repo: new StockRepo(infra.db), assignment })
	const transferService = new TransferService({
		...infra,
		repo: new TransferRepo(infra.db),
		stock: stockService,
		assignment,
		location,
	})
	const receivingService = new ReceivingService({
		...infra,
		repo: new ReceivingRepo(infra.db),
		stock: stockService,
		assignment,
		location,
		material,
		supplier,
		uom,
	})
	const opnameService = new OpnameService({
		...infra,
		repo: new OpnameRepo(infra.db),
		stock: stockService,
		assignment,
		location,
	})

	const route = new Elysia({ prefix: '/inventory', tags: ['inventory'] })
		.use(createStockRoute(stockService))
		.use(createTransferRoute(transferService))
		.use(createReceivingRoute(receivingService))
		.use(createOpnameRoute(opnameService))
	return { route, stockService }
}

export type { StockService }
export type { StockBalanceDto } from '@ikki/contract/inventory/stock'
export type { RecordMovementInput } from '@ikki/contract/inventory/stock'
