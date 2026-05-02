import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/core/validation'

import * as dto from './sales-invoice.dto'
import type { SalesInvoiceService } from './sales-invoice.service'

export function initSalesInvoiceRoute(service: SalesInvoiceService) {
	return new Elysia({ prefix: '/invoice' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.SalesInvoiceFilterDto,
				response: createPaginatedResponseSchema(dto.SalesInvoiceDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(dto.SalesInvoiceDto),
				auth: true,
			},
		)
		.get(
			'/detail-with-items',
			async function detailWithItems({ query }) {
				const result = await service.handleDetailWithItems(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(dto.SalesInvoiceWithItemsDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.SalesInvoiceCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/generate-from-order',
			async function generateFromOrder({ body, auth }) {
				const result = await service.handleGenerateFromOrder(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.SalesInvoiceGenerateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.SalesInvoiceUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query }) {
				const result = await service.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
