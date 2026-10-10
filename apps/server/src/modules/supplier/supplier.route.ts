import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@ikki/contract/http'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@ikki/contract/schema'

import {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierMaterialCreateDto,
	SupplierMaterialDto,
	SupplierMaterialFilterDto,
	SupplierMaterialUpdateDto,
	SupplierUpdateDto,
} from '@ikki/contract/supplier'
import type { SupplierService } from './supplier.service.ts'

export function createSupplierRoute(svc: SupplierService) {
	return new Elysia({ prefix: '/supplier', tags: ['supplier'] })
		.use(authGuard)
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
			async ({ body, auth }) => res.ok(await svc.handleCreate(body, actorOf(auth))),
			{
				body: SupplierCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.create',
			},
		)
		.put('/update', async ({ body, auth }) => res.ok(await svc.handleUpdate(body, actorOf(auth))), {
			body: SupplierUpdateDto,
			response: zRes.ok(EntityRefDto),
			permission: 'supplier.update',
		})
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await svc.handleDelete(query.id, actorOf(auth))),
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
			async ({ body, auth }) => res.ok(await svc.handlePricingCreate(body, actorOf(auth))),
			{
				body: SupplierMaterialCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.create',
			},
		)
		.put(
			'/material/update',
			async ({ body, auth }) => res.ok(await svc.handlePricingUpdate(body, actorOf(auth))),
			{
				body: SupplierMaterialUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.update',
			},
		)
		.delete(
			'/material/remove',
			async ({ query, auth }) => res.ok(await svc.handlePricingDelete(query.id, actorOf(auth))),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.delete',
			},
		)
}
