import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema'

import {
	ProductFilterDto,
	ProductCreateDto,
	ProductUpdateDto,
	ProductSelectDto,
} from './product.contract'
import type { ProductService } from './product.service'

export function createProductRoute(s: ProductService) {
	return new Elysia({ prefix: '/product' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: ProductFilterDto,
				response: createPaginatedResponseDto(ProductSelectDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await s.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(ProductSelectDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await s.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: ProductCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await s.handleUpdate(body.id, body, auth.userId)
				return res.ok(result)
			},
			{
				body: ProductUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await s.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/hard-remove',
			async ({ query }) => {
				const result = await s.handleHardRemove(query.id)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
