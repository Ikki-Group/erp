import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery } from '@/lib/api/index.ts'

import {
	OpnameCompleteDto,
	OpnameCreateDto,
	OpnameDetailDto,
	OpnameDto,
	OpnameFilterDto,
	OpnameUpdateCountsDto,
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailDto,
	ReceivingDto,
	ReceivingFilterDto,
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
} from './dto/index.ts'

// All inventory data is scoped to the active location, so every key folds in
// `{ loc }`. Mutations invalidate the unscoped `root()` so every location's
// cache is refreshed (a transfer touches two locations, for one).

const stockKeys = createResourceKeys('inventory', 'stock', { locationScoped: true })
const movementKeys = createResourceKeys('inventory', 'movement', { locationScoped: true })
const transferKeys = createResourceKeys('inventory', 'transfer', { locationScoped: true })
const opnameKeys = createResourceKeys('inventory', 'opname', { locationScoped: true })
const receivingKeys = createResourceKeys('inventory', 'receiving', { locationScoped: true })

/** Anything that changes on-hand stock also writes movements. */
const stockTouched = [stockKeys.root(), movementKeys.root()]

// ─── Stock ───

export const stockBalanceList = defineQuery({
	method: 'get',
	url: endpoint.inventory.stock.list,
	query: StockBalanceFilterDto,
	result: zRes.paginated(StockBalanceDto),
	queryKey: (query) => stockKeys.list(query),
})

export const stockMovementList = defineQuery({
	method: 'get',
	url: endpoint.inventory.stock.movements,
	query: StockMovementFilterDto,
	result: zRes.paginated(StockMovementDto),
	queryKey: (query) => movementKeys.list(query),
})

// ─── Transfer ───

const transferUrls = endpoint.inventory.transfer

export const transferResource = {
	keys: transferKeys,
	list: defineQuery({
		method: 'get',
		url: transferUrls.list,
		query: TransferFilterDto,
		result: zRes.paginated(TransferDto),
		queryKey: (query) => transferKeys.list(query),
	}),
	detail: defineQuery({
		method: 'get',
		url: transferUrls.detail,
		query: zc.RecordId,
		result: zRes.ok(TransferDetailDto),
		queryKey: (query) => transferKeys.detail(query),
	}),
	create: defineMutation({
		method: 'post',
		url: transferUrls.create,
		body: TransferCreateDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [transferKeys.root()],
	}),
	ship: defineMutation({
		method: 'post',
		url: transferUrls.ship,
		body: TransferShipDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [transferKeys.root(), ...stockTouched],
	}),
	receive: defineMutation({
		method: 'post',
		url: transferUrls.receive,
		body: TransferReceiveDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [transferKeys.root(), ...stockTouched],
	}),
}

// ─── Opname ───

const opnameUrls = endpoint.inventory.opname

export const opnameResource = {
	keys: opnameKeys,
	list: defineQuery({
		method: 'get',
		url: opnameUrls.list,
		query: OpnameFilterDto,
		result: zRes.paginated(OpnameDto),
		queryKey: (query) => opnameKeys.list(query),
	}),
	detail: defineQuery({
		method: 'get',
		url: opnameUrls.detail,
		query: zc.RecordId,
		result: zRes.ok(OpnameDetailDto),
		queryKey: (query) => opnameKeys.detail(query),
	}),
	create: defineMutation({
		method: 'post',
		url: opnameUrls.create,
		body: OpnameCreateDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [opnameKeys.root()],
	}),
	updateCounts: defineMutation({
		method: 'put',
		url: opnameUrls.counts,
		body: OpnameUpdateCountsDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [opnameKeys.root()],
	}),
	complete: defineMutation({
		method: 'post',
		url: opnameUrls.complete,
		body: OpnameCompleteDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [opnameKeys.root(), ...stockTouched],
	}),
}

// ─── Receiving ───

const receivingUrls = endpoint.inventory.receiving

export const receivingResource = {
	keys: receivingKeys,
	list: defineQuery({
		method: 'get',
		url: receivingUrls.list,
		query: ReceivingFilterDto,
		result: zRes.paginated(ReceivingDto),
		queryKey: (query) => receivingKeys.list(query),
	}),
	detail: defineQuery({
		method: 'get',
		url: receivingUrls.detail,
		query: zc.RecordId,
		result: zRes.ok(ReceivingDetailDto),
		queryKey: (query) => receivingKeys.detail(query),
	}),
	create: defineMutation({
		method: 'post',
		url: receivingUrls.create,
		body: ReceivingCreateDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [receivingKeys.root()],
	}),
	confirm: defineMutation({
		method: 'post',
		url: receivingUrls.confirm,
		body: ReceivingConfirmDto,
		result: zRes.ok(zc.RecordId),
		invalidates: [receivingKeys.root(), ...stockTouched],
	}),
}
