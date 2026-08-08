import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
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

// ─── Route Factory ───

export function createSupplierRoute(svc: SupplierService) {
	return (
		new Elysia({ prefix: '/supplier' })
			.use(authPluginMacro)

			// ─── Supplier CRUD ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await svc.handleList(query)
					return res.paginated(result)
				},
				{ query: SupplierFilterDto, response: zRes.paginated(SupplierDto) },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await svc.handleGetById(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(SupplierDto) },
			)
			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await svc.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: SupplierCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/update',
				async ({ body, auth }) => {
					const result = await svc.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: SupplierUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/remove',
				async ({ query, auth }) => {
					const result = await svc.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── Supplier-Material Pricing ───

			.get(
				'/material/list',
				async ({ query }) => {
					const result = await svc.handlePricingList(query)
					return res.paginated(result)
				},
				{ query: SupplierMaterialFilterDto, response: zRes.paginated(SupplierMaterialDto) },
			)
			.post(
				'/material/create',
				async ({ body, auth }) => {
					const result = await svc.handlePricingCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: SupplierMaterialCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/material/update',
				async ({ body, auth }) => {
					const result = await svc.handlePricingUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: SupplierMaterialUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/material/remove',
				async ({ query, auth }) => {
					const result = await svc.handlePricingDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)
	)
}
