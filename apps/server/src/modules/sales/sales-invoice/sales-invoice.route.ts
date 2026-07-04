import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import * as dto from './sales-invoice.contract'
import type { SalesInvoiceService } from './sales-invoice.service'

export function createSalesInvoiceRoute(service: SalesInvoiceService) {
	return new Elysia({ prefix: '/invoice' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.SalesInvoiceFilterDto,
				response: createPaginatedResponseDto(dto.SalesInvoiceDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(dto.SalesInvoiceDto),
				auth: true,
			},
		)
		.get(
			'/detail-with-items',
			async ({ query }) => {
				const result = await service.handleDetailWithItems(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(dto.SalesInvoiceWithItemsDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.SalesInvoiceCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/generate-from-order',
			async ({ body, auth }) => {
				const result = await service.handleGenerateFromOrder(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.SalesInvoiceGenerateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.SalesInvoiceUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await service.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
