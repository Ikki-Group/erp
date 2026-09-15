import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { CompanyApi } from '@/modules/company/index.ts'
import type { InventoryApi } from '@/modules/inventory/index.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { MenuApi } from '@/modules/menu/index.ts'
import type { PaymentMethodService } from '@/modules/payment-method/payment-method.service.ts'
import type { RecipeService } from '@/modules/recipe/recipe.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type { ShiftService } from '../shift/shift.service.ts'
import type { TableService } from '../table/table.service.ts'
import type { VoucherService } from '../voucher/voucher.service.ts'
import { calculateLineTotal, calculateOrderTotals } from './order.calculator.ts'
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
} from './order.contract.ts'
import { deductStockForOrder } from './order.deduction.ts'
import { OrderError } from './order.internal.ts'
import type { IOrderRepo } from './order.repo.ts'

// ─── Dependencies ───

export interface OrderServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	shiftService: ShiftService
	tableService: TableService
	voucherService: VoucherService
	paymentMethodService: PaymentMethodService
	companyApi: CompanyApi
	menuItemDetail: MenuApi['itemDetail']
	locationService: LocationService
	recipeService: RecipeService
	inventoryApi: InventoryApi['stock']
	uomService: UomService
	materialService: MaterialService
}

// ─── Service ───

export class OrderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IOrderRepo,
		cacheClient: CacheClient,
		private readonly deps: OrderServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'pos-order')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<OrderDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<OrderDto> {
		return assertFound(await this.getById(id), () => OrderError.notFound(id))
	}

	async handleDetail(id: number): Promise<OrderDetailDto> {
		const detail = await this.repo.findDetailById(id)
		return assertFound(detail, () => OrderError.notFound(id))
	}

	async handleList(filter: OrderFilterDto): Promise<WithPaginationResult<OrderDto>> {
		return this.repo.findPage(filter)
	}

	// ─── Create ───

	async handleCreate(data: OrderCreateDto, actor: Actor): Promise<EntityRef> {
		const { locationId, tableId, type, notes } = data

		// 1. Validate active shift at location
		const shift = await this.deps.shiftService.handleGetActive(actor.id, locationId)
		if (!shift) throw OrderError.noActiveShift(actor.id, locationId)

		// 2. Get location code for order number
		const location = await this.deps.locationService.handleGetById(locationId)

		// 3. Generate number, insert order, and audit atomically
		const transactionResult = await this.deps.uow.run(async (tx) => {
			const orderNo = await generateNumber({
				prefix: 'ORD',
				locationCode: location.code,
				locationId,
				database: tx,
			})
			const result = await this.repo.insert(
				{
					orderNo,
					locationId,
					tableId: tableId ?? null,
					shiftId: shift.id,
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
			if (!result) throw OrderError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'pos-order',
					entity: 'order',
					entityId: result.id,
					action: 'create',
					summary: `Created order ${orderNo} (${type}) at location #${locationId}`,
					newValues: { orderNo, type, tableId, shiftId: shift.id },
				}),
				tx,
			)
			return { result, orderNo }
		})
		const { result } = transactionResult

		// 4. Update table status and invalidate cache after commit
		if (tableId) {
			await this.deps.tableService.updateStatus(tableId, 'occupied')
		}
		await this.cache.invalidateStandard()
		return result
	}

	// ─── Sync Lines ───

	async handleSyncLines(data: OrderLineSyncDto, actor: Actor): Promise<OrderDetailDto> {
		return record('order.syncLines', async () => {
			const { orderId, lines } = data

			// 1. Validate order exists and is open
			const order = await this.handleGetById(orderId)
			if (order.status !== 'open') throw OrderError.notOpen(orderId)

			// 2. Resolve menu items and calculate prices
			const lineInserts: Parameters<IOrderRepo['insertLines']>[0] = []
			const lineTotals: string[] = []

			for (const line of lines) {
				// Fetch item detail (with modifier groups + options)
				const itemDetail = await this.deps.menuItemDetail(line.menuItemId)

				// Validate item belongs to same location
				if (itemDetail.locationId !== order.locationId) {
					throw OrderError.menuItemWrongLocation(line.menuItemId, order.locationId)
				}

				// Resolve modifier option prices
				const modifierPrices: string[] = []
				const modifierSnapshot: Array<{ optionId: number; name: string; price: string }> = []

				if (line.modifierOptionIds && line.modifierOptionIds.length > 0) {
					// Build a flat map of all available options for this item
					const optionMap = new Map<number, { name: string; priceAdjustment: string }>()
					for (const group of itemDetail.modifierGroups) {
						for (const opt of group.options) {
							optionMap.set(opt.id, { name: opt.name, priceAdjustment: opt.priceAdjustment })
						}
					}

					for (const optionId of line.modifierOptionIds) {
						const option = optionMap.get(optionId)
						if (option) {
							modifierPrices.push(option.priceAdjustment)
							modifierSnapshot.push({
								optionId,
								name: option.name,
								price: option.priceAdjustment,
							})
						}
					}
				}

				// Calculate line prices
				const priceResult = calculateLineTotal({
					basePrice: itemDetail.basePrice,
					modifierPrices,
					qty: String(line.qty),
				})

				lineTotals.push(priceResult.lineTotal)

				lineInserts.push({
					orderId,
					menuItemId: line.menuItemId,
					menuItemName: itemDetail.name,
					quantity: String(line.qty),
					unitPrice: priceResult.unitPrice,
					modifiers: modifierSnapshot.length > 0 ? modifierSnapshot : null,
					modifierTotal: priceResult.modifierTotal,
					discountAmount: '0',
					lineTotal: priceResult.lineTotal,
					status: 'active' as const,
					notes: line.notes ?? null,
				})
			}

			// 3. Replace lines, recalculate totals, and audit atomically
			const taxRate = await this.#getTaxRate()
			const discountAmount = order.discountAmount
			const totals = calculateOrderTotals({ lineTotals, discountAmount, taxRate })

			await this.deps.uow.run(async (tx) => {
				await this.repo.deleteLinesByOrderId(orderId, tx)
				await this.repo.insertLines(lineInserts, tx)

				const updateResult = await this.repo.update(
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
				if (!updateResult) throw OrderError.updateFailed(orderId)

				await this.deps.audit.record(
					auditEntryOf(actor, {
						module: 'pos-order',
						entity: 'order',
						entityId: orderId,
						action: 'update',
						summary: `Synchronized lines for order #${orderId}`,
						newValues: { lineCount: lines.length, subtotal: totals.subtotal, total: totals.total },
					}),
					tx,
				)
			})

			await this.cache.invalidateStandard(orderId)
			return this.handleDetail(orderId)
		})
	}

	// ─── Apply Voucher ───

	async handleApplyVoucher(data: OrderApplyVoucherDto, actor: Actor) {
		const { orderId, voucherCode } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Check no voucher already applied
		if (order.voucherId) throw OrderError.voucherAlreadyApplied(orderId)

		// 3. Validate voucher
		const validation = await this.deps.voucherService.handleValidate(voucherCode, order.subtotal)
		if (!validation.valid) return { applied: false, reason: validation.reason }

		// 4. Get voucher ID
		const voucher = await this.deps.voucherService.getByCode(voucherCode)
		if (!voucher) return { applied: false, reason: 'NOT_FOUND' }

		// 5. Recalculate totals with discount
		const taxRate = await this.#getTaxRate()
		const lines = await this.repo.findLinesByOrderId(orderId)
		const lineTotals = lines.map((l) => l.lineTotal)
		const totals = calculateOrderTotals({
			lineTotals,
			discountAmount: validation.discountAmount,
			taxRate,
		})

		// 6. Update order and audit atomically
		await this.deps.uow.run(async (tx) => {
			const written = await this.repo.update(
				orderId,
				{
					voucherId: voucher.id,
					voucherCode: voucher.code,
					discountAmount: totals.discountAmount,
					taxAmount: totals.taxAmount,
					total: totals.total,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw OrderError.updateFailed(orderId)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'pos-order',
					entity: 'order',
					entityId: orderId,
					action: 'update',
					summary: `Applied voucher "${voucherCode}" to order #${orderId} (discount: ${validation.discountAmount})`,
					newValues: { voucherCode, discountAmount: validation.discountAmount },
				}),
				tx,
			)
			return written
		})

		// 7. Invalidate cache after commit
		await this.cache.invalidateStandard(orderId)
		return { applied: true, discountAmount: validation.discountAmount }
	}

	// ─── Remove Voucher ───

	async handleRemoveVoucher(data: OrderRemoveVoucherDto, actor: Actor): Promise<EntityRef> {
		const { orderId } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Validate voucher is applied
		if (!order.voucherId) throw OrderError.noVoucherApplied(orderId)

		// 3. Recalculate totals without discount
		const taxRate = await this.#getTaxRate()
		const lines = await this.repo.findLinesByOrderId(orderId)
		const lineTotals = lines.map((l) => l.lineTotal)
		const totals = calculateOrderTotals({ lineTotals, discountAmount: '0', taxRate })

		// 4. Update order and audit atomically
		const result = await this.deps.uow.run(async (tx) => {
			const written = await this.repo.update(
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

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'pos-order',
					entity: 'order',
					entityId: orderId,
					action: 'update',
					summary: `Removed voucher "${order.voucherCode}" from order #${orderId}`,
					oldValues: { voucherCode: order.voucherCode },
				}),
				tx,
			)
			return written
		})

		// 5. Invalidate cache after commit
		await this.cache.invalidateStandard(orderId)
		return result
	}

	// ─── Record Payment ───

	async handleRecordPayment(data: OrderPaymentDto, actor: Actor): Promise<EntityRef> {
		const { orderId, paymentMethodId, amount, reference } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Validate payment method available at location
		const methods = await this.deps.paymentMethodService.handleByLocation(order.locationId)
		const method = methods.find((m) => m.id === paymentMethodId)
		if (!method) throw OrderError.paymentMethodNotAvailable(paymentMethodId, order.locationId)

		// 3. Validate amount doesn't exceed remaining
		const totalPaid = Money.of(await this.repo.sumPaymentsByOrderId(orderId))
		const remaining = Money.of(order.total).sub(totalPaid)
		const paymentAmount = Money.of(String(amount))
		if (paymentAmount.gt(remaining)) {
			throw OrderError.paymentExceedsTotal(orderId, paymentAmount.sub(remaining).toString())
		}

		// 4. Insert payment and audit atomically
		const result = await this.deps.uow.run(async (tx) => {
			const written = await this.repo.insertPayment(
				{
					orderId,
					paymentMethodId,
					amount: String(amount),
					reference: reference ?? null,
				},
				tx,
			)
			if (!written) throw OrderError.paymentFailed(orderId)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'pos-order',
					entity: 'payment',
					entityId: written.id,
					action: 'create',
					summary: `Recorded payment of ${amount} for order #${orderId} via method #${paymentMethodId}`,
					newValues: { orderId, paymentMethodId, amount, reference },
				}),
				tx,
			)
			return written
		})

		// 5. Invalidate cache after commit
		await this.cache.invalidateStandard(orderId)
		return result
	}

	// ─── Complete ───

	async handleComplete(data: OrderCompleteDto, actor: Actor): Promise<EntityRef> {
		return record('order.complete', async () => {
			const { orderId } = data
			const order = assertFound(await this.repo.findById(orderId), () =>
				OrderError.notFound(orderId),
			)
			if (order.status !== 'open') throw OrderError.notOpen(orderId)

			const orderTotal = Money.of(order.total)
			const totalPaid = Money.of(await this.repo.sumPaymentsByOrderId(orderId))
			const remaining = orderTotal.sub(totalPaid)
			if (remaining.gt(Money.zero())) throw OrderError.notFullyPaid(orderId, remaining.toString())

			const { updated, movementEvents } = await this.deps.uow.run(async (tx) => {
				const current = assertFound(await this.repo.findById(orderId, tx), () =>
					OrderError.notFound(orderId),
				)
				if (current.status !== 'open') throw OrderError.notOpen(orderId)
				const lines = await this.repo.findLinesByOrderId(orderId, tx)

				const updated = await this.repo.update(
					orderId,
					{
						status: 'completed',
						completedAt: new Date(),
						...stampUpdate(actor.id),
					},
					tx,
				)
				if (!updated) throw OrderError.updateFailed(orderId)

				if (current.voucherId) await this.deps.voucherService.incrementUsage(current.voucherId, tx)

				const movementEvents = await deductStockForOrder(
					orderId,
					current.locationId,
					lines,
					actor.id,
					{
						recipeService: this.deps.recipeService,
						inventoryApi: this.deps.inventoryApi,
						uomService: this.deps.uomService,
						materialService: this.deps.materialService,
					},
					tx,
				)

				await this.deps.audit.record(
					{
						actorId: actor.id,
						actorName: actor.name,
						locationId: current.locationId,
						module: 'pos-order',
						entity: 'order',
						entityId: orderId,
						action: 'complete',
						summary: `Completed order #${orderId} (${current.orderNo})`,
						oldValues: { status: 'open' },
						newValues: { status: 'completed' },
					},
					tx,
				)

				return { updated, movementEvents }
			})

			for (const event of movementEvents) this.deps.events.publish(event)
			await this.deps.inventoryApi.invalidateCache()
			if (order.tableId) await this.deps.tableService.updateStatus(order.tableId, 'available')
			await this.cache.invalidateStandard(orderId)
			return updated
		})
	}

	// ─── Void ───

	async handleVoid(data: OrderVoidDto, actor: Actor): Promise<EntityRef> {
		const { orderId, reason } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Update order status and audit atomically
		const result = await this.deps.uow.run(async (tx) => {
			const written = await this.repo.update(
				orderId,
				{
					status: 'voided',
					notes: reason,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw OrderError.updateFailed(orderId)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'pos-order',
					entity: 'order',
					entityId: orderId,
					action: 'update',
					summary: `Voided order #${orderId} (${order.orderNo}): ${reason}`,
					oldValues: { status: 'open' },
					newValues: { status: 'voided', reason },
				}),
				tx,
			)
			return written
		})

		// 3. Update table status and invalidate cache after commit
		if (order.tableId) {
			await this.deps.tableService.updateStatus(order.tableId, 'available')
		}
		await this.cache.invalidateStandard(orderId)
		return result
	}

	// ─── Private ───

	async #getTaxRate(): Promise<string> {
		return this.deps.companyApi.taxRate.getPercent()
	}
}
