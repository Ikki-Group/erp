import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc } from '@/shared/schema'

import {
	PurchaseOrderApproveDto,
	PurchaseOrderCreateDto,
	PurchaseOrderDto,
	PurchaseOrderFilterDto,
	PurchaseOrderRejectDto,
	PurchaseOrderSelectDto,
	PurchaseOrderSubmitForApprovalDto,
	PurchaseOrderUpdateDto,
} from './purchase-order.contract'
import type { PurchaseOrderModule } from './purchase-order.module'

export function createPurchaseOrderRoute(m: PurchaseOrderModule) {
	return new Elysia({ prefix: '/purchase-order' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: PurchaseOrderFilterDto,
				response: createPaginatedResponseDto(PurchaseOrderSelectDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.handleGetById(query.id)
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
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: PurchaseOrderCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await m.handleUpdate(body, auth.userId)
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
			async ({ body }) => {
				const result = await m.handleRemove(body.id)
				return res.ok(result)
			},
			{
				body: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/submit-for-approval',
			async ({ body }) => {
				const result = await m.handleSubmitForApproval(body)
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
			async ({ body }) => {
				const result = await m.handleApprove(body)
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
			async ({ body }) => {
				const result = await m.handleReject(body)
				return res.ok(result)
			},
			{
				body: PurchaseOrderRejectDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
