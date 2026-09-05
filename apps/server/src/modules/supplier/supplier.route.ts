import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierMaterialCreateDto,
	SupplierMaterialDto,
	SupplierMaterialFilterDto,
	SupplierMaterialUpdateDto,
	SupplierUpdateDto,
} from './supplier.contract.ts'
import type { SupplierService } from './supplier.service.ts'

export function createSupplierRoute(svc: SupplierService) {
	return new Elysia({ prefix: '/supplier', tags: ['supplier'] })
		.use(rbac.as('scoped'))
		.get('/list', async ({ query }) => res.paginated(await svc.handleList(query)), {
			query: SupplierFilterDto,
			response: zRes.paginated(SupplierDto),
			permission: 'supplier.read',
		})
		.get('/detail', async ({ query }) => res.ok(await svc.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(SupplierDto),
			permission: 'supplier.read',
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await svc.handleCreate(body, auth.userId)),
			{
				body: SupplierCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'supplier.create',
			},
		)
		.put('/update', async ({ body, auth }) => res.ok(await svc.handleUpdate(body, auth.userId)), {
			body: SupplierUpdateDto,
			response: zRes.ok(EntityRefDto),
			permission: 'supplier.update',
		})
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await svc.handleDelete(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.delete',
			},
		)
		.get('/material/list', async ({ query }) => res.paginated(await svc.handlePricingList(query)), {
			query: SupplierMaterialFilterDto,
			response: zRes.paginated(SupplierMaterialDto),
			permission: 'supplier.read',
		})
		.post(
			'/material/create',
			async ({ body, auth }) => res.created(await svc.handlePricingCreate(body, auth.userId)),
			{
				body: SupplierMaterialCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'supplier.create',
			},
		)
		.put(
			'/material/update',
			async ({ body, auth }) => res.ok(await svc.handlePricingUpdate(body, auth.userId)),
			{
				body: SupplierMaterialUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.update',
			},
		)
		.delete(
			'/material/remove',
			async ({ query, auth }) => res.ok(await svc.handlePricingDelete(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.delete',
			},
		)
}
