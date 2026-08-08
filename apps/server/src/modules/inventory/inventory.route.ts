import { Elysia } from 'elysia'

import type { createStockModule } from './stock/stock.module.ts'

// ─── Aggregate Route ───

type StockModule = ReturnType<typeof createStockModule>

export function createInventoryRoute(modules: { stock: StockModule }) {
	return new Elysia({ prefix: '/inventory' }).use(modules.stock.route)
}
