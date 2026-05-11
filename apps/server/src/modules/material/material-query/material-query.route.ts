import {
	z,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { MaterialListFilterDto } from './material-query.dto'
import type { MaterialQueryService } from './material-query.service'

export function initMaterialQueryRoute(s: MaterialQueryService) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: MaterialListFilterDto,
				response: createPaginatedResponseSchema(z.any()),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const material = await s.handleDetail(query.id)
				return res.ok(material)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(z.any()),
				auth: true,
			},
		)
}
