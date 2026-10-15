import { crudRoutes } from '@/server/crud-route.ts'
import { actorOf } from '@/shared/auth/actor.ts'
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
	return crudRoutes({
		prefix: '/supplier',
		resource: 'supplier',
		service: svc,
		schemas: {
			filter: SupplierFilterDto,
			dto: SupplierDto,
			create: SupplierCreateDto,
			update: SupplierUpdateDto,
		},
	})
		.get('/material/list', async ({ query }) => res.paginated(await svc.handlePricingList(query)), {
			query: SupplierMaterialFilterDto,
			response: zRes.paginated(SupplierMaterialDto),
			permission: 'supplier.read',
		})
		.post(
			'/material/create',
			async ({ body, auth }) => res.created(await svc.handlePricingCreate(body, actorOf(auth))),
			{
				body: SupplierMaterialCreateDto,
				response: zRes.created(EntityRefDto),
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
