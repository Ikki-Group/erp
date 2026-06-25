import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	PurchaseOrderFilterDto,
	PurchaseOrderDto,
	PurchaseOrderCreateDto,
	PurchaseOrderUpdateDto,
	PurchaseOrderSubmitForApprovalDto,
	PurchaseOrderApproveDto,
	PurchaseOrderRejectDto,
} from './purchase-order.contract'
import type { PurchaseOrderService } from './purchase-order.service'

export function initPurchaseOrderRoute(service: PurchaseOrderService) {
	return new Elysia({ prefix: '/purchase-order' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
				return res.paginated(result)
			},
			{
				query: PurchaseOrderFilterDto,
				response: createPaginatedResponseDto(PurchaseOrderDto),
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
				query: zc.RecordId,
				response: createSuccessResponseDto(PurchaseOrderDto),
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
				body: PurchaseOrderCreateDto,
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
				body: PurchaseOrderUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				const result = await service.handleRemove(context.query.id, context.auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove(context) {
				const result = await service.handleHardRemove(context.query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/submit-for-approval',
			async function submitForApproval(context) {
				const result = await service.handleSubmitForApproval(context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				body: PurchaseOrderSubmitForApprovalDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/approve',
			async function approve(context) {
				const result = await service.handleApprove(context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				body: PurchaseOrderApproveDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/reject',
			async function reject(context) {
				const result = await service.handleReject(context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				body: PurchaseOrderRejectDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
