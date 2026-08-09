import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierMaterialCreateDto,
	SupplierMaterialDto,
	SupplierMaterialFilterDto,
	SupplierMaterialUpdateDto,
	SupplierUpdateDto,
} from './dto/index.ts'

// ─── Supplier Resource (CRUD) ───

export const supplierResource = defineResource({
	urls: endpoint.supplier,
	entitySchema: SupplierDto,
	filter: SupplierFilterDto,
	create: SupplierCreateDto,
	update: SupplierUpdateDto,
})

// ─── Supplier-Material Pricing Endpoints ───

const pricingUrls = endpoint.supplier.material

const pricingKeys = {
	lists: () => [pricingUrls.list] as const,
	list: (query?: unknown) => [pricingUrls.list, query ?? null] as const,
}

const pricingList = defineQuery({
	method: 'get',
	url: pricingUrls.list,
	query: SupplierMaterialFilterDto,
	result: createPaginatedResponseSchema(SupplierMaterialDto),
	queryKey: (query) => pricingKeys.list(query),
})

const pricingCreate = defineMutation({
	method: 'post',
	url: pricingUrls.create,
	body: SupplierMaterialCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [pricingKeys.lists(), supplierResource.keys.lists()],
})

const pricingUpdate = defineMutation({
	method: 'put',
	url: pricingUrls.update,
	body: SupplierMaterialUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [pricingKeys.lists(), supplierResource.keys.lists()],
})

const pricingRemove = defineMutation({
	method: 'delete',
	url: pricingUrls.remove,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [pricingKeys.lists(), supplierResource.keys.lists()],
})

export const pricingResource = {
	keys: pricingKeys,
	list: pricingList,
	create: pricingCreate,
	update: pricingUpdate,
	remove: pricingRemove,
}
