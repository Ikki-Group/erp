import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'

import {
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
	PayrollBatchCreateDto,
	PayrollBatchDto,
} from '../dto/payroll.dto'
import type { PayrollService } from '../service/payroll.service'

export function initPayrollRoute(s: PayrollService) {
	return new Elysia({ detail: { tags: ['Payroll'] } })
		.use(authPluginMacro)
		.post(
			'/batches',
			async ({ body, auth }) => {
				const result = await s.handleBatchCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: PayrollBatchCreateDto,
				response: createSuccessResponseSchema(PayrollBatchDto),
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
				response: createSuccessResponseSchema(PayrollAdjustmentDto),
				auth: true,
			},
		)
}
