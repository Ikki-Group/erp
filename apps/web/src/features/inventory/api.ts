import { endpoint } from '@/config/endpoint.ts'

import { createQueryKeys, defineMutation, defineQuery } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import {
	StockBalanceDto,
	StockBalanceFilterDto,
	StockMovementDto,
	StockMovementFilterDto,
	TransferCreateDto,
	TransferDetailDto,
	TransferDto,
	TransferFilterDto,
	TransferReceiveDto,
	TransferShipDto,
	OpnameApproveDto,
	OpnameCreateDto,
	OpnameDetailDto,
	OpnameDto,
	OpnameFilterDto,
	OpnameUpdateCountsDto,
} from './dto/index.ts'

// ─── Stock Query Keys ───

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

// ─── Transfer Keys ───

const transferUrls = endpoint.inventory.transfer

const transferKeys = {
	lists: () => [transferUrls.list] as const,
	list: (query?: unknown) => [transferUrls.list, query ?? null] as const,
	details: () => [transferUrls.detail] as const,
	detail: (query?: unknown) => [transferUrls.detail, query ?? null] as const,
}

// ─── Transfer List ───

const transferList = defineQuery({
	method: 'get',
	url: transferUrls.list,
	query: TransferFilterDto,
	result: createPaginatedResponseSchema(TransferDto),
	queryKey: (query) => transferKeys.list(query),
})

// ─── Transfer Detail ───

const transferDetail = defineQuery({
	method: 'get',
	url: transferUrls.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(TransferDetailDto),
	queryKey: (query) => transferKeys.detail(query),
})

// ─── Transfer Create ───

const transferCreate = defineMutation({
	method: 'post',
	url: transferUrls.create,
	body: TransferCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [transferKeys.lists()],
})

// ─── Transfer Ship ───

const transferShip = defineMutation({
	method: 'post',
	url: transferUrls.ship,
	body: TransferShipDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [transferKeys.lists(), transferKeys.details()],
})

// ─── Transfer Receive ───

const transferReceive = defineMutation({
	method: 'post',
	url: transferUrls.receive,
	body: TransferReceiveDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [transferKeys.lists(), transferKeys.details()],
})

// ─── Export ───

export const transferResource = {
	keys: transferKeys,
	list: transferList,
	detail: transferDetail,
	create: transferCreate,
	ship: transferShip,
	receive: transferReceive,
}

// ─── Opname Keys ───

const opnameUrls = endpoint.inventory.opname

const opnameKeys = {
	lists: () => [opnameUrls.list] as const,
	list: (query?: unknown) => [opnameUrls.list, query ?? null] as const,
	details: () => [opnameUrls.detail] as const,
	detail: (query?: unknown) => [opnameUrls.detail, query ?? null] as const,
}

// ─── Opname List ───

const opnameList = defineQuery({
	method: 'get',
	url: opnameUrls.list,
	query: OpnameFilterDto,
	result: createPaginatedResponseSchema(OpnameDto),
	queryKey: (query) => opnameKeys.list(query),
})

// ─── Opname Detail ───

const opnameDetail = defineQuery({
	method: 'get',
	url: opnameUrls.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(OpnameDetailDto),
	queryKey: (query) => opnameKeys.detail(query),
})

// ─── Opname Create ───

const opnameCreate = defineMutation({
	method: 'post',
	url: opnameUrls.create,
	body: OpnameCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [opnameKeys.lists()],
})

// ─── Opname Update Counts ───

const opnameUpdateCounts = defineMutation({
	method: 'put',
	url: opnameUrls.counts,
	body: OpnameUpdateCountsDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [opnameKeys.lists(), opnameKeys.details()],
})

// ─── Opname Approve ───

const opnameApprove = defineMutation({
	method: 'post',
	url: opnameUrls.approve,
	body: OpnameApproveDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [opnameKeys.lists(), opnameKeys.details()],
})

// ─── Export ───

export const opnameResource = {
	keys: opnameKeys,
	list: opnameList,
	detail: opnameDetail,
	create: opnameCreate,
	updateCounts: opnameUpdateCounts,
	approve: opnameApprove,
}
