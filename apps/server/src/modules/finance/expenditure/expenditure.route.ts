import { zc } from '@/shared/schema'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import { ExpenditureCreateDto, ExpenditureFilterDto, ExpenditureDto } from './expenditure.contract'
import type { ExpenditureService } from './expenditure.service'

export function initExpenditureRoute(s: ExpenditureService) {
	return new Elysia({ prefix: '/expenditure' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await s.listExpenditures(query)
				return res.paginated(result)
			},
			{
				query: ExpenditureFilterDto,
				response: createPaginatedResponseSchema(ExpenditureDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await s.createExpenditure(body, auth.userId)
				return res.created(result)
			},
			{
				body: ExpenditureCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
