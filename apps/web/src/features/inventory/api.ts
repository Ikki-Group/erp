import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'

import { endpoint } from '@/config/endpoint.ts'

import { createQueryKeys, defineMutation, defineQuery } from '@/lib/api/index.ts'

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
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailDto,
	ReceivingDto,
	ReceivingFilterDto,
} from './dto/index.ts'

// ─── Stock Query Keys ───

export const stockKeys = createQueryKeys('inventory', 'stock')
export const movementKeys = createQueryKeys('inventory', 'movement')

// ─── Balance List ───

export const stockBalanceList = defineQuery({
	method: 'get',
	url: endpoint.inventory.stock.list,
	query: StockBalanceFilterDto,
	result: zRes.paginated(StockBalanceDto),
	queryKey: (query) => stockKeys.list(query),
})

// ─── Movement List ───

export const stockMovementList = defineQuery({
	method: 'get',
	url: endpoint.inventory.stock.movements,
	query: StockMovementFilterDto,
	result: zRes.paginated(StockMovementDto),
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
	result: zRes.paginated(TransferDto),
	queryKey: (query) => transferKeys.list(query),
})

// ─── Transfer Detail ───

const transferDetail = defineQuery({
	method: 'get',
	url: transferUrls.detail,
	query: zc.RecordId,
	result: zRes.ok(TransferDetailDto),
	queryKey: (query) => transferKeys.detail(query),
})

// ─── Transfer Create ───

const transferCreate = defineMutation({
	method: 'post',
	url: transferUrls.create,
	body: TransferCreateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [transferKeys.lists()],
})

// ─── Transfer Ship ───

const transferShip = defineMutation({
	method: 'post',
	url: transferUrls.ship,
	body: TransferShipDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [transferKeys.lists(), transferKeys.details()],
})

// ─── Transfer Receive ───

const transferReceive = defineMutation({
	method: 'post',
	url: transferUrls.receive,
	body: TransferReceiveDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [transferKeys.lists(), transferKeys.details(), stockKeys.lists()],
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
	result: zRes.paginated(OpnameDto),
	queryKey: (query) => opnameKeys.list(query),
})

// ─── Opname Detail ───

const opnameDetail = defineQuery({
	method: 'get',
	url: opnameUrls.detail,
	query: zc.RecordId,
	result: zRes.ok(OpnameDetailDto),
	queryKey: (query) => opnameKeys.detail(query),
})

// ─── Opname Create ───

const opnameCreate = defineMutation({
	method: 'post',
	url: opnameUrls.create,
	body: OpnameCreateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [opnameKeys.lists()],
})

// ─── Opname Update Counts ───

const opnameUpdateCounts = defineMutation({
	method: 'put',
	url: opnameUrls.counts,
	body: OpnameUpdateCountsDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [opnameKeys.lists(), opnameKeys.details()],
})

// ─── Opname Approve ───

const opnameApprove = defineMutation({
	method: 'post',
	url: opnameUrls.approve,
	body: OpnameApproveDto,
	result: zRes.ok(zc.RecordId),
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

// ─── Receiving Keys ───

const receivingUrls = endpoint.inventory.receiving

const receivingKeys = {
	lists: () => [receivingUrls.list] as const,
	list: (query?: unknown) => [receivingUrls.list, query ?? null] as const,
	details: () => [receivingUrls.detail] as const,
	detail: (query?: unknown) => [receivingUrls.detail, query ?? null] as const,
}

// ─── Receiving List ───

const receivingList = defineQuery({
	method: 'get',
	url: receivingUrls.list,
	query: ReceivingFilterDto,
	result: zRes.paginated(ReceivingDto),
	queryKey: (query) => receivingKeys.list(query),
})

// ─── Receiving Detail ───

const receivingDetail = defineQuery({
	method: 'get',
	url: receivingUrls.detail,
	query: zc.RecordId,
	result: zRes.ok(ReceivingDetailDto),
	queryKey: (query) => receivingKeys.detail(query),
})

// ─── Receiving Create ───

const receivingCreate = defineMutation({
	method: 'post',
	url: receivingUrls.create,
	body: ReceivingCreateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [receivingKeys.lists(), stockKeys.lists()],
})

// ─── Receiving Confirm ───

const receivingConfirm = defineMutation({
	method: 'post',
	url: receivingUrls.confirm,
	body: ReceivingConfirmDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [receivingKeys.lists(), receivingKeys.details(), stockKeys.lists()],
})

// ─── Export ───

export const receivingResource = {
	keys: receivingKeys,
	list: receivingList,
	detail: receivingDetail,
	create: receivingCreate,
	confirm: receivingConfirm,
}
