import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import {
	OrderApplyVoucherDto,
	OrderCompleteDto,
	OrderCreateDto,
	OrderFilterDto,
	OrderLineSyncDto,
	OrderPaymentDto,
	OrderRemoveVoucherDto,
	OrderVoidDto,
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
				{ query: OrderFilterDto },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await service.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)

			// ─── Order Lifecycle ───

			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await service.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: OrderCreateDto },
			)
			.post(
				'/complete',
				async ({ body, auth }) => {
					const result = await service.handleComplete(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderCompleteDto },
			)
			.post(
				'/void',
				async ({ body, auth }) => {
					const result = await service.handleVoid(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderVoidDto },
			)

			// ─── Lines ───

			.post(
				'/lines/sync',
				async ({ body, auth }) => {
					const result = await service.handleSyncLines(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderLineSyncDto },
			)

			// ─── Voucher ───

			.post(
				'/voucher/apply',
				async ({ body, auth }) => {
					const result = await service.handleApplyVoucher(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderApplyVoucherDto },
			)
			.post(
				'/voucher/remove',
				async ({ body, auth }) => {
					const result = await service.handleRemoveVoucher(body, auth.userId)
					return res.ok(result)
				},
				{ body: OrderRemoveVoucherDto },
			)

			// ─── Payment ───

			.post(
				'/payment',
				async ({ body, auth }) => {
					const result = await service.handleRecordPayment(body, auth.userId)
					return res.created(result)
				},
				{ body: OrderPaymentDto },
			)
	)
}
