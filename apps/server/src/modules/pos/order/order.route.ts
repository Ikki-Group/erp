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
		new Elysia({ prefix: '/order' })
			.use(authPlugin)
			.use(rbac)

			// ─── Queries ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await service.handleList(query)
					return res.paginated(result)
				},
				{ query: OrderFilterDto, permission: 'order.read', response: zRes.paginated(OrderDto) },
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
				},
			)
			.get(
				'/detail',
				async ({ query, actor }) => {
					const result = await service.handleDetail(query.id, actor)
					return res.ok(result)
				},
				{ query: zq.recordId, permission: 'order.read', response: zRes.ok(OrderDetailDto) },
			)

			// ─── Order Lifecycle ───

			.post(
				'/create',
				async ({ body, actor }) => {
					const result = await service.handleCreate(body, actor)
					return res.created(result)
				},
				{ body: OrderCreateDto, permission: 'order.create', response: zRes.created(EntityRefDto) },
			)
			.post(
				'/complete',
				async ({ body, actor }) => {
					const result = await service.handleComplete(body, actor)
					return res.ok(result)
				},
				{ body: OrderCompleteDto, permission: 'order.update', response: zRes.ok(EntityRefDto) },
			)
			.post(
				'/void',
				async ({ body, actor }) => {
					const result = await service.handleVoid(body, actor)
					return res.ok(result)
				},
				{ body: OrderVoidDto, permission: 'order.void', response: zRes.ok(EntityRefDto) },
			)

			// ─── Lines ───

			.post(
				'/lines/sync',
				async ({ body, actor }) => {
					const result = await service.handleSyncLines(body, actor)
					return res.ok(result)
				},
				{ body: OrderLineSyncDto, permission: 'order.update', response: zRes.ok(EntityRefDto) },
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
				},
			)
	)
}
