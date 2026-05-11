import {
	z,
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	MaterialConversionCreateDto,
	MaterialConversionDto,
	MaterialConversionFilterDto,
	MaterialConversionUpdateDto,
} from './material-conversion.dto'
import type { MaterialConversionService } from './material-conversion.service'

export function initMaterialConversionRoute(s: MaterialConversionService) {
	return new Elysia({ prefix: '/conversion' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: MaterialConversionFilterDto,
				response: createPaginatedResponseSchema(MaterialConversionDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const conversion = await s.handleDetail(query.id)
				return res.ok(conversion)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(MaterialConversionDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: MaterialConversionCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.handleUpdate(body, auth.userId)
				return res.ok({ id })
			},
			{
				body: MaterialConversionUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query }) {
				const { id } = await s.handleRemove(query.id)
				return res.ok({ id })
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
