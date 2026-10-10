import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@ikki/contract/http'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@ikki/contract/schema'

import {
	OrderApplyVoucherDto,
	OrderCompleteDto,
	OrderCreateDto,
	OrderDetailDto,
	OrderDto,
	OrderFilterDto,
	OrderLineSyncDto,
	OrderPaymentDto,
	OrderRemoveVoucherDto,
	OrderVoidDto,
	OrderVoucherApplyResultDto,
} from '@ikki/contract/pos/order'
import type { OrderService } from './order.service.ts'

// ─── Route Factory ───

export function createOrderRoute(service: OrderService) {
	return (
		new Elysia({ prefix: '/order' })
			.use(authGuard)

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
				'/detail',
				async ({ query }) => {
					const result = await service.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, permission: 'order.read', response: zRes.ok(OrderDetailDto) },
			)

			// ─── Order Lifecycle ───

			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await service.handleCreate(body, actorOf(auth))
					return res.ok(result)
				},
				{ body: OrderCreateDto, permission: 'order.create', response: zRes.ok(EntityRefDto) },
			)
			.post(
				'/complete',
				async ({ body, auth }) => {
					const result = await service.handleComplete(body, actorOf(auth))
					return res.ok(result)
				},
				{ body: OrderCompleteDto, permission: 'order.update', response: zRes.ok(EntityRefDto) },
			)
			.post(
				'/void',
				async ({ body, auth }) => {
					const result = await service.handleVoid(body, actorOf(auth))
					return res.ok(result)
				},
				{ body: OrderVoidDto, permission: 'order.void', response: zRes.ok(EntityRefDto) },
			)

			// ─── Lines ───

			.post(
				'/lines/sync',
				async ({ body, auth }) => {
					const result = await service.handleSyncLines(body, actorOf(auth))
					return res.ok(result)
				},
				{ body: OrderLineSyncDto, permission: 'order.update', response: zRes.ok(EntityRefDto) },
			)

			// ─── Voucher ───

			.post(
				'/voucher/apply',
				async ({ body, auth }) => {
					const result = await service.handleApplyVoucher(body, actorOf(auth))
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
				async ({ body, auth }) => {
					const result = await service.handleRemoveVoucher(body, actorOf(auth))
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
				async ({ body, auth }) => {
					const result = await service.handleRecordPayment(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: OrderPaymentDto,
					permission: 'payment.create',
					response: zRes.ok(EntityRefDto),
				},
			)
	)
}
