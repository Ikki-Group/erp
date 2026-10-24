import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	OrderApplyVoucherDto,
	OrderCompleteDto,
	OrderCreateDto,
	OrderCursorFilterDto,
	OrderDetailDto,
	OrderDto,
	OrderFilterDto,
	OrderLineSyncDto,
	OrderPaymentDto,
	OrderRemoveVoucherDto,
	OrderVoidDto,
	OrderVoucherApplyResultDto,
} from './order.contract.ts'
import type { OrderService } from './order.service.ts'

// ─── Route Factory ───

export function createOrderRoute(service: OrderService) {
	return (
		new Elysia({ prefix: '/order', tags: ['Orders'] })
			.use(authPlugin)
			.use(rbac)

			// ─── Queries ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await service.handleList(query)
					return res.paginated(result)
				},
				{
					query: OrderFilterDto,
					permission: 'order.read',
					response: zRes.paginated(OrderDto),
					detail: { summary: 'List orders' },
				},
			)
			.get(
				'/list/cursor',
				async ({ query }) => {
					const result = await service.handleCursorList(query)
					return res.cursorPaginated(result)
				},
				{
					query: OrderCursorFilterDto,
					permission: 'order.read',
					response: zRes.cursorPaginated(OrderDto),
					detail: { summary: 'List orders (cursor)' },
				},
			)
			.get(
				'/detail',
				async ({ query, actor }) => {
					const result = await service.handleDetail(query.id, actor)
					return res.ok(result)
				},
				{
					query: zq.recordId,
					permission: 'order.read',
					response: zRes.ok(OrderDetailDto),
					detail: { summary: 'Get order detail' },
				},
			)

			// ─── Order Lifecycle ───

			.post(
				'/create',
				async ({ body, actor }) => {
					const result = await service.handleCreate(body, actor)
					return res.created(result)
				},
				{
					body: OrderCreateDto,
					permission: 'order.create',
					response: zRes.created(EntityRefDto),
					detail: {
						summary: 'Create an order',
						description:
							'Opens a new order. Requires the caller to have an open shift at the location, and a table (if given) must belong to that location; a table is marked occupied. Idempotent on `externalRef`: a retry returns the existing order instead of creating another.',
					},
				},
			)
			.post(
				'/complete',
				async ({ body, actor }) => {
					const result = await service.handleComplete(body, actor)
					return res.ok(result)
				},
				{
					body: OrderCompleteDto,
					permission: 'order.update',
					response: zRes.ok(EntityRefDto),
					detail: {
						summary: 'Complete an order',
						description:
							'Only an open, fully paid order can be completed. Deducts recipe ingredients from stock, counts the applied voucher as used, and frees the table.',
					},
				},
			)
			.post(
				'/void',
				async ({ body, actor }) => {
					const result = await service.handleVoid(body, actor)
					return res.ok(result)
				},
				{
					body: OrderVoidDto,
					permission: 'order.void',
					response: zRes.ok(EntityRefDto),
					detail: {
						summary: 'Void an order',
						description:
							'Only an open order can be voided; the reason is stored as the order notes and the table is freed. Stock is not deducted.',
					},
				},
			)

			// ─── Lines ───

			.post(
				'/lines/sync',
				async ({ body, actor }) => {
					const result = await service.handleSyncLines(body, actor)
					return res.ok(result)
				},
				{
					body: OrderLineSyncDto,
					permission: 'order.update',
					response: zRes.ok(EntityRefDto),
					detail: {
						summary: 'Sync order lines',
						description:
							'Replaces all lines of an open order with the submitted list (not a merge). Prices are re-resolved from the menu items, which must belong to the order location, and totals are recalculated.',
					},
				},
			)

			// ─── Voucher ───

			.post(
				'/voucher/apply',
				async ({ body, actor }) => {
					const result = await service.handleApplyVoucher(body, actor)
					return res.ok(result)
				},
				{
					body: OrderApplyVoucherDto,
					permission: 'discount.apply',
					response: zRes.ok(OrderVoucherApplyResultDto),
					detail: {
						summary: 'Apply a voucher to an order',
						description:
							'Only on an open order with no voucher yet. An invalid voucher is not an error: the response has `applied: false` and a reason. On success the discount and totals are recalculated.',
					},
				},
			)
			.post(
				'/voucher/remove',
				async ({ body, actor }) => {
					const result = await service.handleRemoveVoucher(body, actor)
					return res.ok(result)
				},
				{
					body: OrderRemoveVoucherDto,
					permission: 'discount.apply',
					response: zRes.ok(EntityRefDto),
					detail: {
						summary: 'Remove a voucher from an order',
						description:
							'Only on an open order that has a voucher. Clears the discount and recalculates totals.',
					},
				},
			)

			// ─── Payment ───

			.post(
				'/payment',
				async ({ body, actor }) => {
					const result = await service.handleRecordPayment(body, actor)
					return res.created(result)
				},
				{
					body: OrderPaymentDto,
					permission: 'payment.create',
					response: zRes.created(EntityRefDto),
					detail: {
						summary: 'Record an order payment',
						description:
							'Only on an open order. The payment method must be available at the order location and the amount cannot exceed the remaining balance; partial payments are allowed.',
					},
				},
			)
	)
}
