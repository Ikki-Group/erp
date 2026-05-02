import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc } from '@/core/validation'

import * as dto from './purchase-order.dto'
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
				query: dto.PurchaseOrderFilterDto,
				response: createPaginatedResponseSchema(dto.PurchaseOrderSelectDto),
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
				response: createSuccessResponseSchema(dto.PurchaseOrderDto),
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
				body: dto.PurchaseOrderCreateDto,
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
				body: dto.PurchaseOrderUpdateDto,
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
		.delete(
			'/hard-remove',
			async function hardRemove({ body }) {
				const result = await service.handleHardRemove(body.id)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/submit-for-approval',
			async function submitForApproval({ body, auth }) {
				const result = await service.handleSubmitForApproval(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PurchaseOrderSubmitForApprovalDto,
				response: createSuccessResponseSchema(zc.RecordId),
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
				body: dto.PurchaseOrderApproveDto,
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
				body: dto.PurchaseOrderRejectDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
