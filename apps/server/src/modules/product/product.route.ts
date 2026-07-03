import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'

import {
	ProductFilterDto,
	ProductCreateDto,
	ProductUpdateDto,
	ProductSelectDto,
} from './product.contract'
import type { ProductService } from './product.service'

export function initProductRoute(s: ProductService) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await s.handleList(context.query)
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
			async function detail(context) {
				const product = await s.handleDetail(context.query.id)
				return res.ok(product)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(ProductSelectDto),
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
				body: ProductCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update(context) {
				const { id } = await s.handleUpdate(context.body.id, context.body, context.auth.userId)
				return res.ok({ id })
			},
			{
				body: ProductUpdateDto,
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
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove(context) {
				await s.handleHardRemove(context.query.id)
				return res.ok({ id: context.query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
