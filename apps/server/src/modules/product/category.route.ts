import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import {
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
	ProductCategoryDto,
} from './category.contract'
import type { ProductCategoryService } from './category.service'

export function createCategoryRoute(s: ProductCategoryService) {
	return new Elysia({ prefix: '/category' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: ProductCategoryFilterDto,
				response: createPaginatedResponseDto(ProductCategoryDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const category = await s.handleDetail(query.id)
				return res.ok(category)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(ProductCategoryDto),
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
				body: ProductCategoryCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await s.handleUpdate(body.id, body, auth.userId)
				return res.ok(result)
			},
			{
				body: ProductCategoryUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				await s.handleRemove(query.id)
				return res.ok({ id: query.id })
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/hard-remove',
			async ({ query }) => {
				await s.handleHardRemove(query.id)
				return res.ok({ id: query.id })
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
