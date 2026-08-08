import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import {
	SupplierCreateDto,
	SupplierFilterDto,
	SupplierMaterialCreateDto,
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
				{ query: SupplierFilterDto },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await svc.handleGetById(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)
			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await svc.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: SupplierCreateDto },
			)
			.put(
				'/update',
				async ({ body, auth }) => {
					const result = await svc.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: SupplierUpdateDto },
			)
			.delete(
				'/remove',
				async ({ query, auth }) => {
					const result = await svc.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)

			// ─── Supplier-Material Pricing ───

			.get(
				'/material/list',
				async ({ query }) => {
					const result = await svc.handlePricingList(query)
					return res.paginated(result)
				},
				{ query: SupplierMaterialFilterDto },
			)
			.post(
				'/material/create',
				async ({ body, auth }) => {
					const result = await svc.handlePricingCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: SupplierMaterialCreateDto },
			)
			.put(
				'/material/update',
				async ({ body, auth }) => {
					const result = await svc.handlePricingUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: SupplierMaterialUpdateDto },
			)
			.delete(
				'/material/remove',
				async ({ query, auth }) => {
					const result = await svc.handlePricingDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)
	)
}
