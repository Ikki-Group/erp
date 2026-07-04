import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema'

import * as dto from './stock-transfer.contract'
import type { StockTransferService } from './stock-transfer.service'

export function initStockTransferRoute(service: StockTransferService) {
	return new Elysia({ prefix: '/stock-transfer' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.StockTransferFilterDto,
				response: createPaginatedResponseDto(dto.StockTransferSelectDto),
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
				query: zc.RecordId,
				response: createSuccessResponseDto(dto.StockTransferDto),
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
				body: dto.StockTransferCreateDto,
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
				body: dto.StockTransferUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body, auth }) => {
				const result = await service.handleRemove(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/approve',
			async ({ body, auth }) => {
				const result = await service.handleApprove(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferApproveDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/reject',
			async ({ body, auth }) => {
				const result = await service.handleReject(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferRejectDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/mark-in-transit',
			async ({ body, auth }) => {
				const result = await service.handleMarkInTransit(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferMarkInTransitDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/mark-completed',
			async ({ body, auth }) => {
				const result = await service.handleMarkCompleted(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferMarkCompletedDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/cancel',
			async ({ body, auth }) => {
				const result = await service.handleCancel(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.StockTransferCancelDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
