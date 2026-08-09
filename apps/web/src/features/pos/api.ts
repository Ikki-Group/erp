import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
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
	urls: endpoint.pos.table,
	entitySchema: TableDto,
	filter: TableFilterDto,
	create: TableCreateDto,
	update: TableUpdateDto,
})

// ─── Shift Endpoints ───

const shiftUrls = endpoint.pos.shift

const shiftKeys = {
	lists: () => [shiftUrls.list] as const,
	list: (query?: unknown) => [shiftUrls.list, query ?? null] as const,
	details: () => [shiftUrls.detail] as const,
	detail: (query?: unknown) => [shiftUrls.detail, query ?? null] as const,
	actives: () => [shiftUrls.active] as const,
	active: (locationId?: unknown) => [shiftUrls.active, locationId ?? null] as const,
}

const shiftList = defineQuery({
	method: 'get',
	url: shiftUrls.list,
	query: ShiftFilterDto,
	result: createPaginatedResponseSchema(ShiftDto),
	queryKey: (query) => shiftKeys.list(query),
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
	queryKey: () => shiftKeys.actives(),
})

const shiftOpen = defineMutation({
	method: 'post',
	url: shiftUrls.open,
	body: ShiftOpenDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [shiftKeys.lists(), shiftKeys.actives()],
})

const shiftClose = defineMutation({
	method: 'post',
	url: shiftUrls.close,
	body: ShiftCloseDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [shiftKeys.lists(), shiftKeys.actives()],
})

const shiftCloseOther = defineMutation({
	method: 'post',
	url: shiftUrls.closeOther,
	body: ShiftCloseDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [shiftKeys.lists(), shiftKeys.actives()],
})

export const shiftResource = {
	keys: shiftKeys,
	list: shiftList,
	detail: shiftDetail,
	active: shiftActive,
	open: shiftOpen,
	close: shiftClose,
	closeOther: shiftCloseOther,
}

// ─── Voucher Resource ───

export const voucherResource = defineResource({
	urls: endpoint.pos.voucher,
	entitySchema: VoucherDto,
	filter: VoucherFilterDto,
	create: VoucherCreateDto,
	update: VoucherUpdateDto,
})

// ─── Order Resource ───

const orderUrls = endpoint.pos.order

const orderKeys = {
	lists: () => [orderUrls.list] as const,
	list: (query?: unknown) => [orderUrls.list, query ?? null] as const,
	details: () => [orderUrls.detail] as const,
	detail: (query?: unknown) => [orderUrls.detail, query ?? null] as const,
}

const orderList = defineQuery({
	method: 'get',
	url: orderUrls.list,
	query: OrderFilterDto,
	result: createPaginatedResponseSchema(OrderDto),
	queryKey: (query) => orderKeys.list(query),
})

const orderDetail = defineQuery({
	method: 'get',
	url: orderUrls.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(OrderDetailDto),
	queryKey: (query) => orderKeys.detail(query),
})

const orderCreate = defineMutation({
	method: 'post',
	url: orderUrls.create,
	body: OrderCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [orderKeys.lists()],
})

const orderComplete = defineMutation({
	method: 'post',
	url: orderUrls.complete,
	body: OrderCompleteDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [orderKeys.lists(), orderKeys.details()],
})

const orderVoid = defineMutation({
	method: 'post',
	url: orderUrls.void,
	body: OrderVoidDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [orderKeys.lists(), orderKeys.details()],
})

const orderLinesSync = defineMutation({
	method: 'post',
	url: orderUrls.linesSync,
	body: OrderLineSyncDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [orderKeys.details()],
})

const orderVoucherApply = defineMutation({
	method: 'post',
	url: orderUrls.voucherApply,
	body: OrderApplyVoucherDto,
	result: createSuccessResponseSchema(OrderVoucherApplyResultDto),
	invalidates: [orderKeys.details()],
})

const orderVoucherRemove = defineMutation({
	method: 'post',
	url: orderUrls.voucherRemove,
	body: OrderRemoveVoucherDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [orderKeys.details()],
})

const orderPayment = defineMutation({
	method: 'post',
	url: orderUrls.payment,
	body: OrderPaymentInputDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [orderKeys.details()],
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
