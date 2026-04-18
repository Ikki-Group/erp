import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zRecordIdDto,
} from '@/core/validation'

import * as dto from '../dto'
import type { FinanceServiceModule } from '../service'

export function initExpenditureRoute(module: FinanceServiceModule) {
	const service = module.expenditure
	return new Elysia({ prefix: '/expenditure' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.listExpenditures(query)
				// Manual pagination wrap since service returns a plain array currently
				// In a full implementation, we'd use a repository with count.
				// For Ikki ERP Golden Path 2.1, keeping it simple as requested.
				return res.ok(result)
			},
			{
				query: dto.ExpenditureFilterDto,
				// response: createPaginatedResponseSchema(dto.ExpenditureDto), 
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.createExpenditure(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.ExpenditureCreateDto,
				response: createSuccessResponseSchema(zRecordIdDto),
				auth: true,
			},
		)
}
