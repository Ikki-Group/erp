import { Elysia } from 'elysia'

import type { createOpnameModule } from './opname/opname.module.ts'
import type { createReceivingModule } from './receiving/receiving.module.ts'
import type { createStockModule } from './stock/stock.module.ts'
import type { createTransferModule } from './transfer/transfer.module.ts'

// ─── Aggregate Route ───

type StockModule = ReturnType<typeof createStockModule>
type TransferModule = ReturnType<typeof createTransferModule>
type ReceivingModule = ReturnType<typeof createReceivingModule>
type OpnameModule = ReturnType<typeof createOpnameModule>

export function createInventoryRoute(modules: {
	stock: StockModule
	transfer: TransferModule
	receiving: ReceivingModule
	opname: OpnameModule
}) {
	return new Elysia({ prefix: '/inventory' })
		.use(modules.stock.route)
		.use(modules.transfer.route)
		.use(modules.receiving.route)
		.use(modules.opname.route)
}
