import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	PurchaseOrderFilterDto,
	PurchaseOrderSelectDto,
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
			async function list({ query }) {
				const result = await service.handleList(query)
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
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
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
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
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
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body, auth.userId)
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
			async function remove({ query, auth }) {
				const result = await service.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ query }) {
				const result = await service.handleHardRemove(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/submit-for-approval',
			async function submitForApproval({ body, auth }) {
				const result = await service.handleSubmitForApproval(body, auth.userId)
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
			async function approve({ body, auth }) {
				const result = await service.handleApprove(body, auth.userId)
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
			async function reject({ body, auth }) {
				const result = await service.handleReject(body, auth.userId)
				return res.ok(result)
			},
			{
				body: PurchaseOrderRejectDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
