import type { Db } from '@/infra/database/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { CompanyService } from '@/modules/company/index.ts'
import type { LocationService } from '@/modules/location/index.ts'
import type { ComposedService } from '@/modules/menu/index.ts'
import type { PaymentMethodService } from '@/modules/payment-method/index.ts'

import type { ShiftService } from '../shift/shift.service.ts'
import type { TableService } from '../table/table.service.ts'
import { evaluateVoucher } from '../voucher/voucher.calculator.ts'
import type { VoucherService } from '../voucher/voucher.service.ts'
import { calculateLineTotal, calculateOrderTotals, remainingBalance } from './order.calculator.ts'
import type {
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
import { deductStockForOrder } from './order.deduction.ts'
import type { DeductionDeps } from './order.deduction.ts'
import { OrderError } from './order.internal.ts'
import type { OrderRepo } from './order.repo.ts'

interface Deps extends Infra, DeductionDeps {
	repo: OrderRepo
	shift: Pick<ShiftService, 'getActive'>
	table: Pick<TableService, 'updateStatus'>
	voucher: Pick<VoucherService, 'getByCode' | 'incrementUsage'>
	paymentMethod: Pick<PaymentMethodService, 'handleByLocation'>
	company: Pick<CompanyService, 'getTaxRatePercent'>
	menu: Pick<ComposedService, 'handleDetail'>
	location: Pick<LocationService, 'handleGetById'>
}

type LineInsert = Parameters<OrderRepo['insertLines']>[0][number]

const AUDIT = { module: 'pos-order', entity: 'order' } as const

export class OrderService {
	constructor(private readonly deps: Deps) {}

	async handleDetail(id: number): Promise<OrderDetailDto> {
		return assertFound(await this.deps.repo.findDetailById(id), () => OrderError.notFound(id))
	}

	handleList(filter: OrderFilterDto): Promise<WithPaginationResult<OrderDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleCreate(data: OrderCreateDto, actor: Actor): Promise<EntityRef> {
		const { locationId, tableId, type, notes } = data
		const { repo, uow, audit, shift, table, location } = this.deps
		const loc = await location.handleGetById(locationId)
		return uow.run(async (tx) => {
			const active = await shift.getActive(actor.id, locationId, tx)
			if (!active) throw OrderError.noActiveShift(actor.id, locationId)
			const orderNo = await generateNumber({
				prefix: 'ORD',
				locationCode: loc.code,
				locationId,
				database: tx,
			})
			const written = await repo.insert(
				{
					orderNo,
					locationId,
					tableId: tableId ?? null,
					shiftId: active.id,
					type,
					status: 'open',
					subtotal: '0',
					discountAmount: '0',
					taxAmount: '0',
					total: '0',
					notes: notes ?? null,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw OrderError.createFailed()
			if (tableId) await table.updateStatus(tableId, 'occupied', tx)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created order ${orderNo} (${type}) at location #${locationId}`,
				newValues: { orderNo, type, tableId, shiftId: active.id },
				locationId,
			})
			return written
		})
	}

	/** Replaces all lines with server-priced snapshots (ADR-0012 §4, ADR-0017). */
	handleSyncLines(data: OrderLineSyncDto, actor: Actor): Promise<OrderDetailDto> {
		const { orderId, lines } = data
		const { repo, uow, audit, menu, company } = this.deps
		return record('order.syncLines', async () => {
			const taxRate = await company.getTaxRatePercent()
			await uow.run(async (tx) => {
				const order = await this.#lockOpen(orderId, tx)
				const inserts: LineInsert[] = []
				for (const line of lines) {
					const item = await menu.handleDetail(line.menuItemId, tx)
					if (item.locationId !== order.locationId) {
						throw OrderError.menuItemWrongLocation(line.menuItemId, order.locationId)
					}
					if (item.status !== 'active') throw OrderError.menuItemInactive(line.menuItemId)
					// Unknown option ids are ignored; only the item's own options can price a line.
					const options = new Map(
						item.modifierGroups.flatMap((g) => g.options.map((o) => [o.id, o] as const)),
					)
					const modifiers = (line.modifierOptionIds ?? []).flatMap((optionId) => {
						const opt = options.get(optionId)
						return opt ? [{ optionId, name: opt.name, price: opt.priceAdjustment }] : []
					})
					const price = calculateLineTotal({
						basePrice: item.basePrice,
						modifierPrices: modifiers.map((m) => m.price),
						qty: String(line.qty),
					})
					inserts.push({
						orderId,
						menuItemId: line.menuItemId,
						menuItemName: item.name,
						quantity: String(line.qty),
						unitPrice: price.unitPrice,
						modifiers: modifiers.length > 0 ? modifiers : null,
						modifierTotal: price.modifierTotal,
						discountAmount: '0',
						lineTotal: price.lineTotal,
						status: 'active',
						notes: line.notes ?? null,
					})
				}
				const totals = calculateOrderTotals({
					lineTotals: inserts.map((l) => l.lineTotal),
					discountAmount: order.discountAmount,
					taxRate,
				})
				await repo.deleteLinesByOrderId(orderId, tx)
				await repo.insertLines(inserts, tx)
				const written = await repo.update(
					orderId,
					{
						subtotal: totals.subtotal,
						discountAmount: totals.discountAmount,
						taxAmount: totals.taxAmount,
						total: totals.total,
						...stampUpdate(actor.id),
					},
					tx,
				)
				if (!written) throw OrderError.updateFailed(orderId)
				await audit.record(tx, actor, {
					...AUDIT,
					entityId: orderId,
					action: 'update',
					summary: `Synchronized lines for order #${orderId}`,
					newValues: { lineCount: lines.length, subtotal: totals.subtotal, total: totals.total },
					locationId: order.locationId,
				})
			})
			return this.handleDetail(orderId)
		})
	}

	async handleApplyVoucher(
		data: OrderApplyVoucherDto,
		actor: Actor,
	): Promise<OrderVoucherApplyResultDto> {
		const { orderId, voucherCode } = data
		const { repo, uow, audit, voucher, company } = this.deps
		const taxRate = await company.getTaxRatePercent()
		return uow.run(async (tx) => {
			const order = await this.#lockOpen(orderId, tx)
			if (order.voucherId) throw OrderError.voucherAlreadyApplied(orderId)
			const found = await voucher.getByCode(voucherCode, tx)
			const validation = evaluateVoucher(found, Money.of(order.subtotal), new Date())
			if (!found || !validation.valid) return { applied: false, reason: validation.reason }

			const totals = calculateOrderTotals({
				lineTotals: (await repo.findLinesByOrderId(orderId, tx)).map((l) => l.lineTotal),
				discountAmount: validation.discountAmount,
				taxRate,
			})
			const written = await repo.update(
				orderId,
				{
					voucherId: found.id,
					voucherCode: found.code,
					discountAmount: totals.discountAmount,
					taxAmount: totals.taxAmount,
					total: totals.total,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw OrderError.updateFailed(orderId)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: orderId,
				action: 'update',
				summary: `Applied voucher "${voucherCode}" to order #${orderId} (discount: ${validation.discountAmount})`,
				newValues: { voucherCode, discountAmount: validation.discountAmount },
				locationId: order.locationId,
			})
			return { applied: true, discountAmount: validation.discountAmount }
		})
	}

	async handleRemoveVoucher(data: OrderRemoveVoucherDto, actor: Actor): Promise<EntityRef> {
		const { orderId } = data
		const { repo, uow, audit, company } = this.deps
		const taxRate = await company.getTaxRatePercent()
		return uow.run(async (tx) => {
			const order = await this.#lockOpen(orderId, tx)
			if (!order.voucherId) throw OrderError.noVoucherApplied(orderId)
			const totals = calculateOrderTotals({
				lineTotals: (await repo.findLinesByOrderId(orderId, tx)).map((l) => l.lineTotal),
				discountAmount: '0',
				taxRate,
			})
			const written = await repo.update(
				orderId,
				{
					voucherId: null,
					voucherCode: null,
					discountAmount: totals.discountAmount,
					taxAmount: totals.taxAmount,
					total: totals.total,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw OrderError.updateFailed(orderId)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: orderId,
				action: 'update',
				summary: `Removed voucher "${order.voucherCode}" from order #${orderId}`,
				oldValues: { voucherCode: order.voucherCode },
				locationId: order.locationId,
			})
			return written
		})
	}

	handleRecordPayment(data: OrderPaymentDto, actor: Actor): Promise<EntityRef> {
		const { orderId, paymentMethodId, reference } = data
		const { repo, uow, audit, paymentMethod } = this.deps
		const amount = Money.of(data.amount)
		return uow.run(async (tx) => {
			const order = await this.#lockOpen(orderId, tx)
			const methods = await paymentMethod.handleByLocation(order.locationId)
			if (!methods.some((m) => m.id === paymentMethodId)) {
				throw OrderError.paymentMethodNotAvailable(paymentMethodId, order.locationId)
			}
			const remaining = remainingBalance(order.total, await repo.sumPaymentsByOrderId(orderId, tx))
			if (amount.gt(remaining)) {
				throw OrderError.paymentExceedsTotal(orderId, amount.sub(remaining).toString())
			}
			const written = await repo.insertPayment(
				{ orderId, paymentMethodId, amount: amount.toString(), reference: reference ?? null },
				tx,
			)
			if (!written) throw OrderError.paymentFailed(orderId)
			await audit.record(tx, actor, {
				module: 'pos-order',
				entity: 'payment',
				entityId: written.id,
				action: 'create',
				summary: `Recorded payment of ${amount.toString()} for order #${orderId} via method #${paymentMethodId}`,
				newValues: { orderId, paymentMethodId, amount: amount.toString(), reference },
				locationId: order.locationId,
			})
			return written
		})
	}

	/** One atomic use-case (ADR-0013 §1): paid check, complete, voucher usage, stock, table, audit. */
	handleComplete(data: OrderCompleteDto, actor: Actor): Promise<EntityRef> {
		const { orderId } = data
		const { repo, uow, audit, voucher, table } = this.deps
		return record('order.complete', () =>
			uow.run(async (tx) => {
				const order = await this.#lockOpen(orderId, tx)
				const remaining = remainingBalance(
					order.total,
					await repo.sumPaymentsByOrderId(orderId, tx),
				)
				if (remaining.gt(Money.zero())) {
					throw OrderError.notFullyPaid(orderId, remaining.toString())
				}
				const written = await repo.update(
					orderId,
					{ status: 'completed', completedAt: new Date(), ...stampUpdate(actor.id) },
					tx,
				)
				if (!written) throw OrderError.updateFailed(orderId)
				if (order.voucherId) await voucher.incrementUsage(order.voucherId, tx)
				const lines = await repo.findLinesByOrderId(orderId, tx)
				await deductStockForOrder(order, lines, actor.id, this.deps, tx)
				if (order.tableId) await table.updateStatus(order.tableId, 'available', tx)
				await audit.record(tx, actor, {
					...AUDIT,
					entityId: orderId,
					action: 'complete',
					summary: `Completed order #${orderId} (${order.orderNo})`,
					oldValues: { status: 'open' },
					newValues: { status: 'completed' },
					locationId: order.locationId,
				})
				return written
			}),
		)
	}

	/** Voids an open order (nothing was deducted yet, so no stock reversal). */
	handleVoid(data: OrderVoidDto, actor: Actor): Promise<EntityRef> {
		const { orderId, reason } = data
		const { repo, uow, audit, table } = this.deps
		return uow.run(async (tx) => {
			const order = await this.#lockOpen(orderId, tx)
			const written = await repo.update(
				orderId,
				{ status: 'voided', notes: reason, ...stampUpdate(actor.id) },
				tx,
			)
			if (!written) throw OrderError.updateFailed(orderId)
			if (order.tableId) await table.updateStatus(order.tableId, 'available', tx)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: orderId,
				action: 'void',
				summary: `Voided order #${orderId} (${order.orderNo}): ${reason}`,
				oldValues: { status: 'open' },
				newValues: { status: 'voided', reason },
				locationId: order.locationId,
			})
			return written
		})
	}

	async #lockOpen(id: number, tx: Db): Promise<OrderDto> {
		const order = await this.deps.repo.lockOpen(id, tx)
		if (order) return order
		if (await this.deps.repo.findById(id, tx)) throw OrderError.notOpen(id)
		throw OrderError.notFound(id)
	}
}
