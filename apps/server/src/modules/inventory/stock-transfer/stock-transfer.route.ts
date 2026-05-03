import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './stock-transfer.dto'
import type { StockTransferService } from './stock-transfer.service'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc } from '@/lib/validation'

export function initStockTransferRoute(service: StockTransferService) {
	return new Elysia({ prefix: '/stock-transfer' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.StockTransferFilterDto,
				response: createPaginatedResponseSchema(dto.StockTransferSelectDto),
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
				query: zc.RecordId,
				response: createSuccessResponseSchema(dto.StockTransferDto),
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
				body: dto.StockTransferCreateDto,
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
				body: dto.StockTransferUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body, auth }) {
				const result = await service.handleRemove(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/approve',
			async function approve({ body, auth }) {
				const result = await service.handleApprove(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferApproveDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/reject',
			async function reject({ body, auth }) {
				const result = await service.handleReject(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferRejectDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/mark-in-transit',
			async function markInTransit({ body, auth }) {
				const result = await service.handleMarkInTransit(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferMarkInTransitDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/mark-completed',
			async function markCompleted({ body, auth }) {
				const result = await service.handleMarkCompleted(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferMarkCompletedDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/cancel',
			async function cancel({ body, auth }) {
				const result = await service.handleCancel(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferCancelDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
