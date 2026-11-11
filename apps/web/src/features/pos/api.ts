import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import {
	OrderApplyVoucherDto,
	OrderCompleteDto,
	OrderCreateDto,
	OrderDetailDto,
	OrderDto,
	OrderFilterDto,
	OrderLineSyncDto,
	OrderPaymentInputDto,
	OrderRemoveVoucherDto,
	OrderVoidDto,
	OrderVoucherApplyResultDto,
	ShiftCloseDto,
	ShiftDetailDto,
	ShiftDto,
	ShiftFilterDto,
	ShiftOpenDto,
	TableCreateDto,
	TableDto,
	TableFilterDto,
	TableUpdateDto,
	VoucherCreateDto,
	VoucherDto,
	VoucherFilterDto,
	VoucherUpdateDto,
} from './dto/index.ts'

// ─── Table Resource ───

export const tableResource = defineResource({
	feature: 'pos',
	resource: 'table',
	urls: endpoint.pos.table,
	entitySchema: TableDto,
	filter: TableFilterDto,
	create: TableCreateDto,
	update: TableUpdateDto,
})

// ─── Shift Endpoints ───
//
// Shift isn't plain CRUD (no update/remove; opens/closes rather than
// creates/deletes), so it composes canonical location-scoped keys from
// `createResourceKeys` with hand-written endpoints instead of `defineResource`.
// Shift data is always scoped to the active location, so the keys fold in the
// active `locationId` — location 1's shifts and location 2's cache separately,
// and a location switch invalidates only this location's entries.

const shiftUrls = endpoint.pos.shift

const shiftKeys = createResourceKeys('pos', 'shift', { locationScoped: true })
/** Active-shift key — location-scoped, distinct from the list/detail kinds. */
const shiftActiveKey = () => [...shiftKeys.all(), 'active']

const shiftList = defineQuery({
	method: 'get',
	url: shiftUrls.list,
	query: ShiftFilterDto,
	result: createPaginatedResponseSchema(ShiftDto),
	queryKey: (query) => shiftKeys.list(query),
	tier: 'volatile',
})

const shiftDetail = defineQuery({
	method: 'get',
	url: shiftUrls.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(ShiftDetailDto),
	queryKey: (query) => shiftKeys.detail(query),
})

const shiftActive = defineQuery({
	method: 'get',
	url: shiftUrls.active,
	result: createSuccessResponseSchema(ShiftDto.nullable()),
	queryKey: shiftActiveKey,
	tier: 'volatile',
})

// Invalidation targets are resolver functions, not precomputed keys: a
// location-scoped key folds in the active `locationId` via `getActiveLocationId()`,
// which must be read at mutation time (post-switch), not at module-load time.
const shiftOpen = defineMutation({
	method: 'post',
	url: shiftUrls.open,
	body: ShiftOpenDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => shiftKeys.lists(), () => shiftActiveKey()],
})

const shiftClose = defineMutation({
	method: 'post',
	url: shiftUrls.close,
	body: ShiftCloseDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => shiftKeys.lists(), () => shiftActiveKey()],
})

const shiftCloseOther = defineMutation({
	method: 'post',
	url: shiftUrls.closeOther,
	body: ShiftCloseDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => shiftKeys.lists(), () => shiftActiveKey()],
})

export const shiftResource = {
	keys: shiftKeys,
	activeKey: shiftActiveKey,
	list: shiftList,
	detail: shiftDetail,
	active: shiftActive,
	open: shiftOpen,
	close: shiftClose,
	closeOther: shiftCloseOther,
}

// ─── Voucher Resource ───

export const voucherResource = defineResource({
	feature: 'pos',
	resource: 'voucher',
	urls: endpoint.pos.voucher,
	entitySchema: VoucherDto,
	filter: VoucherFilterDto,
	create: VoucherCreateDto,
	update: VoucherUpdateDto,
})

// ─── Order Endpoints ───
//
// Like shift, order isn't plain CRUD (create/complete/void/payment rather than
// create/update/remove), so it composes canonical location-scoped keys with
// hand-written endpoints. Both list and detail keys fold the active location
// (order detail is only ever read within the location that owns the order, so
// scoping it is consistent and harmless). Both are `volatile` since an open
// order's lines/total change continuously as it's built.

const orderUrls = endpoint.pos.order

const orderKeys = createResourceKeys('pos', 'order', { locationScoped: true })

const orderList = defineQuery({
	method: 'get',
	url: orderUrls.list,
	query: OrderFilterDto,
	result: createPaginatedResponseSchema(OrderDto),
	queryKey: (query) => orderKeys.list(query),
	tier: 'volatile',
})

const orderDetail = defineQuery({
	method: 'get',
	url: orderUrls.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(OrderDetailDto),
	queryKey: (query) => orderKeys.detail(query),
	tier: 'volatile',
})

// Invalidation targets are resolvers so the location-scoped keys read the
// active `locationId` at mutation time, not at module load.
const orderCreate = defineMutation({
	method: 'post',
	url: orderUrls.create,
	body: OrderCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => orderKeys.lists()],
})

const orderComplete = defineMutation({
	method: 'post',
	url: orderUrls.complete,
	body: OrderCompleteDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => orderKeys.lists(), () => orderKeys.details()],
})

const orderVoid = defineMutation({
	method: 'post',
	url: orderUrls.void,
	body: OrderVoidDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => orderKeys.lists(), () => orderKeys.details()],
})

const orderLinesSync = defineMutation({
	method: 'post',
	url: orderUrls.linesSync,
	body: OrderLineSyncDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => orderKeys.details()],
})

const orderVoucherApply = defineMutation({
	method: 'post',
	url: orderUrls.voucherApply,
	body: OrderApplyVoucherDto,
	result: createSuccessResponseSchema(OrderVoucherApplyResultDto),
	invalidates: [() => orderKeys.details()],
})

const orderVoucherRemove = defineMutation({
	method: 'post',
	url: orderUrls.voucherRemove,
	body: OrderRemoveVoucherDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => orderKeys.details()],
})

const orderPayment = defineMutation({
	method: 'post',
	url: orderUrls.payment,
	body: OrderPaymentInputDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [() => orderKeys.details()],
})

export const orderResource = {
	keys: orderKeys,
	list: orderList,
	detail: orderDetail,
	create: orderCreate,
	complete: orderComplete,
	void: orderVoid,
	linesSync: orderLinesSync,
	voucherApply: orderVoucherApply,
	voucherRemove: orderVoucherRemove,
	payment: orderPayment,
}
