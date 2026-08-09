import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import {
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
