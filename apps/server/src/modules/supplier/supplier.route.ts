import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { res } from '@/core/http/response'

import { authPluginMacro } from '@/server/plugins/auth.plugin'

import {
	SupplierSchema,
	SupplierFilterSchema,
	SupplierCreateSchema,
	SupplierUpdateSchema,
} from './supplier.schema'
import type { SupplierService } from './supplier.service'

export function initSupplierRoute(service: SupplierService) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: SupplierFilterSchema,
				response: createPaginatedResponseSchema(SupplierSchema),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(SupplierSchema), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: SupplierCreateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: SupplierUpdateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const result = await service.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
