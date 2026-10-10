import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'

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
	feature: 'supplier',
	resource: 'supplier',
	urls: endpoint.supplier,
	entitySchema: SupplierDto,
	filter: SupplierFilterDto,
	create: SupplierCreateDto,
	update: SupplierUpdateDto,
})

// ─── Supplier-Material Pricing Endpoints ───

const pricingUrls = endpoint.supplier.material

const pricingKeys = createResourceKeys('supplier', 'pricing')

const pricingList = defineQuery({
	method: 'get',
	url: pricingUrls.list,
	query: SupplierMaterialFilterDto,
	result: zRes.paginated(SupplierMaterialDto),
	queryKey: (query) => pricingKeys.list(query),
})

const pricingCreate = defineMutation({
	method: 'post',
	url: pricingUrls.create,
	body: SupplierMaterialCreateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [pricingKeys.root(), supplierResource.keys.root()],
})

const pricingUpdate = defineMutation({
	method: 'put',
	url: pricingUrls.update,
	body: SupplierMaterialUpdateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [pricingKeys.root(), supplierResource.keys.root()],
})

const pricingRemove = defineMutation({
	method: 'delete',
	url: pricingUrls.remove,
	query: zc.RecordId,
	result: zRes.ok(zc.RecordId),
	invalidates: [pricingKeys.root(), supplierResource.keys.root()],
})

export const pricingResource = {
	keys: pricingKeys,
	list: pricingList,
	create: pricingCreate,
	update: pricingUpdate,
	remove: pricingRemove,
}
