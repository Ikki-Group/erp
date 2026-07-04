import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import {
	SupplierDto,
	SupplierFilterDto,
	SupplierCreateDto,
	SupplierUpdateDto,
} from './supplier.contract'
import type { SupplierModule } from './supplier.module'

export function createSupplierRoute(m: SupplierModule) {
	return new Elysia({ prefix: '/supplier' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: SupplierFilterDto,
				response: createPaginatedResponseDto(SupplierDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.handleGetById(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(SupplierDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: SupplierCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await m.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: SupplierUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body, auth }) => {
				const result = await m.handleDelete(body.id, auth.userId)
				return res.ok(result)
			},
			{
				body: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
