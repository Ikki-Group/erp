import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zRecordIdDto,
} from '@/core/validation'

import * as dto from '../dto/supplier.dto'
import type { SupplierServiceModule } from '../service'

export function initSupplierRoute(module: SupplierServiceModule) {
	const service = module.supplier
	return new Elysia({ prefix: '/supplier' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query, query)
				return res.paginated(result)
			},
			{
				query: dto.SupplierFilterDto,
				response: createPaginatedResponseSchema(dto.SupplierDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zRecordIdDto, response: createSuccessResponseSchema(dto.SupplierDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.SupplierCreateDto,
				response: createSuccessResponseSchema(zRecordIdDto),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const { id, ...data } = body
				const result = await service.handleUpdate(id, data, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.SupplierUpdateDto,
				response: createSuccessResponseSchema(zRecordIdDto),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const result = await service.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
		)
}
