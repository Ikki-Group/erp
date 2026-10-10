import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'
import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'

import {
	UomConversionCreateDto,
	UomConversionDto,
	UomCreateDto,
	UomDto,
	UomFilterDto,
	UomUpdateDto,
} from './dto/index.ts'

// ─── Unit Resource (CRUD) ───

export const uomResource = defineResource({
	feature: 'uom',
	resource: 'uom',
	urls: endpoint.uom,
	entitySchema: UomDto,
	filter: UomFilterDto,
	create: UomCreateDto,
	update: UomUpdateDto,
})

// ─── All Units (unpaginated, for selectors/labels) ───

export const uomListAll = defineQuery({
	method: 'get',
	url: endpoint.uom.list,
	query: UomFilterDto,
	result: zRes.paginated(UomDto),
	queryKey: (query) => [endpoint.uom.list, 'all', query ?? null],
})

// ─── Conversion Endpoints ───

const conversionUrls = endpoint.uom.conversion

const conversionKeys = {
	lists: () => [conversionUrls.list] as const,
	list: () => [conversionUrls.list] as const,
}

const conversionList = defineQuery({
	method: 'get',
	url: conversionUrls.list,
	result: zRes.ok(z.array(UomConversionDto)),
	queryKey: () => [conversionUrls.list],
})

const conversionCreate = defineMutation({
	method: 'post',
	url: conversionUrls.create,
	body: UomConversionCreateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [conversionKeys.lists(), uomResource.keys.lists()],
})

const conversionRemove = defineMutation({
	method: 'delete',
	url: conversionUrls.remove,
	query: zc.RecordId,
	result: zRes.ok(zc.RecordId),
	invalidates: [conversionKeys.lists(), uomResource.keys.lists()],
})

export const conversionResource = {
	keys: conversionKeys,
	list: conversionList,
	create: conversionCreate,
	remove: conversionRemove,
}
