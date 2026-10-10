import { zRes } from '@ikki/contract/http'
import { EntityRefDto, zq } from '@ikki/contract/schema'
import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'

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

// ─── Conversion Endpoints ───
const conversionUrls = endpoint.uom.conversion
const conversionKeys = createResourceKeys('uom', 'conversion')

const conversionList = defineQuery({
	method: 'get',
	url: conversionUrls.list,
	result: zRes.ok(z.array(UomConversionDto)),
	queryKey: () => conversionKeys.list(),
})

const conversionCreate = defineMutation({
	method: 'post',
	url: conversionUrls.create,
	body: UomConversionCreateDto,
	result: zRes.ok(EntityRefDto),
	invalidates: [conversionKeys.root()],
})

const conversionRemove = defineMutation({
	method: 'delete',
	url: conversionUrls.remove,
	query: zq.recordId,
	result: zRes.ok(EntityRefDto),
	invalidates: [conversionKeys.root()],
})

export const conversionResource = {
	list: conversionList,
	create: conversionCreate,
	remove: conversionRemove,
}
