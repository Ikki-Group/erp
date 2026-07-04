import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import * as dto from './payment.contract'
import type { PaymentModule } from './payment.module'

export function createPaymentRoute(m: PaymentModule) {
	return new Elysia({ prefix: '/transaction' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.PaymentFilterDto,
				response: createPaginatedResponseDto(dto.PaymentDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(dto.PaymentDto),
				auth: true,
			},
		)
		.get(
			'/invoices',
			async ({ query }) => {
				const result = await m.getPaymentInvoices(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(dto.PaymentInvoiceDto.array()),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.PaymentCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await m.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PaymentUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body }) => {
				const result = await m.handleRemove(body.id)
				return res.ok(result)
			},
			{
				body: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
