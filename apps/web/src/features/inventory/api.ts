import { endpoint } from '@/config/endpoint.ts'
import { createQueryKeys, defineQuery } from '@/lib/api/index.ts'
import { createPaginatedResponseSchema } from '@/lib/validation/index.ts'

import {
	StockBalanceDto,
	StockBalanceFilterDto,
	StockMovementDto,
	StockMovementFilterDto,
} from './dto/index.ts'

// ─── Query Keys ───

export const stockKeys = createQueryKeys('inventory', 'stock')
export const movementKeys = createQueryKeys('inventory', 'movement')

// ─── Balance List ───

export const stockBalanceList = defineQuery({
	method: 'get',
	url: endpoint.inventory.stock.list,
	query: StockBalanceFilterDto,
	result: createPaginatedResponseSchema(StockBalanceDto),
	queryKey: (query) => stockKeys.list(query),
})

// ─── Movement List ───

export const stockMovementList = defineQuery({
	method: 'get',
	url: endpoint.inventory.stock.movements,
	query: StockMovementFilterDto,
	result: createPaginatedResponseSchema(StockMovementDto),
	queryKey: (query) => movementKeys.list(query),
})
