import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './sales-invoice.contract'
import type { SalesInvoiceService } from './sales-invoice.service'

export function initSalesInvoiceRoute(service: SalesInvoiceService) {
	return new Elysia({ prefix: '/invoice' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
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
			async function detailWithItems(context) {
				const result = await service.handleDetailWithItems(context.query.id)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
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
			async function generateFromOrder(context) {
				const result = await service.handleGenerateFromOrder(context.body, context.auth.userId)
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
			async function update(context) {
				const result = await service.handleUpdate(context.body, context.auth.userId)
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
			async function remove(context) {
				const result = await service.handleRemove(context.query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
