import { crudRoutes } from '@/server/crud-route.ts'
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
		tag: 'Suppliers',
		entity: 'supplier',
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
			detail: { tags: ['Supplier Pricing'], summary: 'List supplier material pricing' },
		})
		.post(
			'/material/create',
			async ({ body, actor }) => res.created(await svc.handlePricingCreate(body, actor)),
			{
				body: SupplierMaterialCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'supplier.create',
				detail: {
					tags: ['Supplier Pricing'],
					summary: 'Create supplier material pricing',
					description:
						'One price per supplier and material pair; fails if the pair already exists.',
				},
			},
		)
		.put(
			'/material/update',
			async ({ body, actor }) => res.ok(await svc.handlePricingUpdate(body, actor)),
			{
				body: SupplierMaterialUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.update',
				detail: { tags: ['Supplier Pricing'], summary: 'Update supplier material pricing' },
			},
		)
		.delete(
			'/material/remove',
			async ({ query, actor }) => res.ok(await svc.handlePricingDelete(query.id, actor)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'supplier.delete',
				detail: { tags: ['Supplier Pricing'], summary: 'Delete supplier material pricing' },
			},
		)
}
