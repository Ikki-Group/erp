import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

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
} from './order.contract.ts'
import type { OrderService } from './order.service.ts'

// ─── Route Factory ───

export function createOrderRoute(service: OrderService) {
	return (
		new Elysia({ prefix: '/order' })
			.use(authPluginMacro)

			// ─── Queries ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await service.handleList(query)
					return res.paginated(result)
				},
				{ query: OrderFilterDto, response: zRes.paginated(OrderDto) },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await service.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(OrderDetailDto) },
			)

			// ─── Order Lifecycle ───

			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await service.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: OrderCreateDto, response: zRes.created(EntityRefDto) },
			)
			.post(
				'/complete',
				async ({ body, auth }) => {
					const result = await service.handleComplete(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderCompleteDto, response: zRes.ok(EntityRefDto) },
			)
			.post(
				'/void',
				async ({ body, auth }) => {
					const result = await service.handleVoid(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderVoidDto, response: zRes.ok(EntityRefDto) },
			)

			// ─── Lines ───

			.post(
				'/lines/sync',
				async ({ body, auth }) => {
					const result = await service.handleSyncLines(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderLineSyncDto, response: zRes.ok(EntityRefDto) },
			)

			// ─── Voucher ───

			.post(
				'/voucher/apply',
				async ({ body, auth }) => {
					const result = await service.handleApplyVoucher(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderApplyVoucherDto, response: zRes.ok(OrderVoucherApplyResultDto) },
			)
			.post(
				'/voucher/remove',
				async ({ body, auth }) => {
					const result = await service.handleRemoveVoucher(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderRemoveVoucherDto, response: zRes.ok(EntityRefDto) },
			)

			// ─── Payment ───

			.post(
				'/payment',
				async ({ body, auth }) => {
					const result = await service.handleRecordPayment(body, auth.userId)
					return res.created(result)
				},
				{ body: OrderPaymentDto, response: zRes.created(EntityRefDto) },
			)
	)
}
