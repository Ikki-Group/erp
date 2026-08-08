import { Elysia } from 'elysia'

import type { createStockModule } from './stock/stock.module.ts'
import type { createTransferModule } from './transfer/transfer.module.ts'

// ─── Aggregate Route ───

type StockModule = ReturnType<typeof createStockModule>
type TransferModule = ReturnType<typeof createTransferModule>

export function createInventoryRoute(modules: { stock: StockModule; transfer: TransferModule }) {
	return new Elysia({ prefix: '/inventory' }).use(modules.stock.route).use(modules.transfer.route)
}
