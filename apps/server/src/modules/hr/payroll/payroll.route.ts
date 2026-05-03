import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
	PayrollBatchCreateDto,
	PayrollBatchDto,
} from './payroll.dto'
import type { PayrollService } from './payroll.service'
import { createSuccessResponseSchema, zc } from '@/lib/validation'

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
		.post(
			'/batches/finalize',
			async ({ body, auth }) => {
				const result = await s.handleFinalizeBatch(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(PayrollBatchDto), auth: true },
		)
}
