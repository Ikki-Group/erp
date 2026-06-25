import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'
import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './payment.contract'
import type { PaymentService } from './payment.service'

export function initPaymentRoute(service: PaymentService) {
	return new Elysia({ prefix: '/transaction' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(dto.PaymentDto), auth: true },
		)
		.get(
			'/invoices',
			async function invoices(context) {
				const result = await service.getPaymentInvoices(context.query.id)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PaymentCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update(context) {
				const result = await service.handleUpdate(context.body, context.auth.userId)
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
			async function remove(context) {
				const result = await service.handleRemove(context.query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
