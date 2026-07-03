import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zq } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'

import {
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
	ProductCategoryDto,
} from './category.contract'
import type { ProductCategoryService } from './category.service'

export function initProductCategoryRoute(s: ProductCategoryService) {
	return new Elysia({ prefix: '/category' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await s.handleList(context.query)
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
			async function detail(context) {
				const category = await s.handleDetail(context.query.id)
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
			async function create(context) {
				const { id } = await s.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{
				body: ProductCategoryCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update(context) {
				const { id } = await s.handleUpdate(context.body.id, context.body, context.auth.userId)
				return res.ok({ id })
			},
			{
				body: ProductCategoryUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				await s.handleRemove(context.query.id)
				return res.ok({ id: context.query.id })
			},
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove(context) {
				await s.handleHardRemove(context.query.id)
				return res.ok({ id: context.query.id })
			},
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
