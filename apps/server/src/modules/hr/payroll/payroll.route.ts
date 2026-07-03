import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import {
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
	PayrollBatchCreateDto,
	PayrollBatchDto,
	PayrollBatchFilterDto,
} from './payroll.contract'
import type { PayrollService } from './payroll.service'

export function initPayrollRoute(s: PayrollService) {
	return new Elysia({ detail: { tags: ['Payroll'] } })
		.use(authPluginMacro)
		.get(
			'/batches',
			async ({ query }) => {
				const result = await s.handleBatchList(query)
				return res.paginated(result)
			},
			{
				query: PayrollBatchFilterDto,
				response: createPaginatedResponseDto(PayrollBatchDto),
				auth: true,
			},
		)
		.post(
			'/batches',
			async ({ body, auth }) => {
				const result = await s.handleBatchCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: PayrollBatchCreateDto,
				response: createSuccessResponseDto(PayrollBatchDto),
				auth: true,
			},
		)
		.post(
			'/adjustments',
			async ({ body, auth }) => {
				const result = await s.handleAddAdjustment(body, auth.userId)
				return res.created(result)
			},
			{
				body: PayrollAdjustmentCreateDto,
				response: createSuccessResponseDto(PayrollAdjustmentDto),
				auth: true,
			},
		)
		.post(
			'/batches/finalize',
			async ({ body, auth }) => {
				const result = await s.handleFinalizeBatch(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseDto(PayrollBatchDto), auth: true },
		)
}
