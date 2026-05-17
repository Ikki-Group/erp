import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	PurchaseOrderFilterSchema,
	PurchaseOrderSelectSchema,
	PurchaseOrderSchema,
	PurchaseOrderCreateSchema,
	PurchaseOrderUpdateSchema,
	PurchaseOrderSubmitForApprovalSchema,
	PurchaseOrderApproveSchema,
	PurchaseOrderRejectSchema,
} from './purchase-order.schema'
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
				query: PurchaseOrderFilterSchema,
				response: createPaginatedResponseSchema(PurchaseOrderSelectSchema),
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
				response: createSuccessResponseSchema(PurchaseOrderSchema),
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
				body: PurchaseOrderCreateSchema,
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
				body: PurchaseOrderUpdateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const result = await service.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ query }) {
				const result = await service.handleHardRemove(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/submit-for-approval',
			async function submitForApproval({ body, auth }) {
				const result = await service.handleSubmitForApproval(body, auth.userId)
				return res.ok(result)
			},
			{
				body: PurchaseOrderSubmitForApprovalSchema,
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
				body: PurchaseOrderApproveSchema,
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
				body: PurchaseOrderRejectSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
