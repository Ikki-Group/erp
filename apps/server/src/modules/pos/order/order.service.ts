import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { CompanyService } from '@/modules/company/company.service.ts'
import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { ComposedService } from '@/modules/menu/composed/composed.service.ts'
import type { ItemService } from '@/modules/menu/item/item.service.ts'
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
	shiftService: ShiftService
	tableService: TableService
	voucherService: VoucherService
	paymentMethodService: PaymentMethodService
	companyService: CompanyService
	itemService: ItemService
	composedService: ComposedService
	locationService: LocationService
	recipeService: RecipeService
	stockService: StockService
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

	async handleCreate(data: OrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		const { locationId, tableId, type, notes } = data

		// 1. Validate active shift at location
		const shift = await this.deps.shiftService.handleGetActive(actorId, locationId)
		if (!shift) throw OrderError.noActiveShift(actorId, locationId)

		// 2. Get location code for order number
		const location = await this.deps.locationService.handleGetById(locationId)

		// 3. Generate order number
		const orderNo = await generateNumber({
			prefix: 'ORD',
			locationCode: location.code,
			locationId,
		})

		// 4. Insert order
		const result = await this.repo.insert({
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
			...stampCreate(actorId),
		})
		if (!result) throw OrderError.createFailed()

		// 5. Update table status if dine-in
		if (tableId) {
			await this.deps.tableService.updateStatus(tableId, 'occupied')
		}

		// 6. Invalidate cache
		await this.cache.invalidateStandard()

		// 7. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			locationId,
			module: 'pos-order',
			entity: 'order',
			entityId: result.id,
			action: 'create',
			summary: `Created order ${orderNo} (${type}) at location #${locationId}`,
			newValues: { orderNo, type, tableId, shiftId: shift.id },
		})

		return result
	}

	// ─── Sync Lines ───

	async handleSyncLines(data: OrderLineSyncDto, actorId: ActorId): Promise<OrderDetailDto> {
		const { orderId, lines } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Resolve menu items and calculate prices
		const lineInserts = []
		const lineTotals: number[] = []

		for (const line of lines) {
			// Fetch item detail (with modifier groups + options)
			const itemDetail = await this.deps.composedService.handleDetail(line.menuItemId)

			// Validate item belongs to same location
			if (itemDetail.locationId !== order.locationId) {
				throw OrderError.menuItemWrongLocation(line.menuItemId, order.locationId)
			}

			// Resolve modifier option prices
			const modifierPrices: number[] = []
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
						modifierPrices.push(Number(option.priceAdjustment))
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
				basePrice: Number(itemDetail.basePrice),
				modifierPrices,
				qty: line.qty,
			})

			lineTotals.push(priceResult.lineTotal)

			lineInserts.push({
				orderId,
				menuItemId: line.menuItemId,
				menuItemName: itemDetail.name,
				quantity: String(line.qty),
				unitPrice: String(priceResult.unitPrice),
				modifiers: modifierSnapshot.length > 0 ? modifierSnapshot : null,
				modifierTotal: String(priceResult.modifierTotal),
				discountAmount: '0',
				lineTotal: String(priceResult.lineTotal),
				status: 'active' as const,
				notes: line.notes ?? null,
			})
		}

		// 3. Replace lines (delete old + insert new)
		await this.repo.deleteLinesByOrderId(orderId)
		await this.repo.insertLines(lineInserts)

		// 4. Recalculate order totals
		const taxRate = await this.#getTaxRate()
		const discountAmount = Number(order.discountAmount)
		const totals = calculateOrderTotals({ lineTotals, discountAmount, taxRate })

		// 5. Update order totals
		const updateResult = await this.repo.update(orderId, {
			subtotal: String(totals.subtotal),
			discountAmount: String(totals.discountAmount),
			taxAmount: String(totals.taxAmount),
			total: String(totals.total),
			...stampUpdate(actorId),
		})
		if (!updateResult) throw OrderError.updateFailed(orderId)

		// 6. Invalidate cache
		await this.cache.invalidateStandard(orderId)

		// 7. Return updated detail
		return this.handleDetail(orderId)
	}

	// ─── Apply Voucher ───

	async handleApplyVoucher(data: OrderApplyVoucherDto, actorId: ActorId) {
		const { orderId, voucherCode } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Check no voucher already applied
		if (order.voucherId) throw OrderError.voucherAlreadyApplied(orderId)

		// 3. Validate voucher
		const subtotal = Number(order.subtotal)
		const validation = await this.deps.voucherService.handleValidate(voucherCode, subtotal)

		if (!validation.valid) {
			return { applied: false, reason: validation.reason }
		}

		// 4. Get voucher ID
		const voucher = await this.deps.voucherService.getByCode(voucherCode)
		if (!voucher) return { applied: false, reason: 'NOT_FOUND' }

		// 5. Recalculate totals with discount
		const taxRate = await this.#getTaxRate()
		const lines = await this.repo.findLinesByOrderId(orderId)
		const lineTotals = lines.map((l) => Number(l.lineTotal))
		const totals = calculateOrderTotals({
			lineTotals,
			discountAmount: validation.discountAmount,
			taxRate,
		})

		// 6. Update order
		const updateResult = await this.repo.update(orderId, {
			voucherId: voucher.id,
			voucherCode: voucher.code,
			discountAmount: String(totals.discountAmount),
			taxAmount: String(totals.taxAmount),
			total: String(totals.total),
			...stampUpdate(actorId),
		})
		if (!updateResult) throw OrderError.updateFailed(orderId)

		// 7. Invalidate cache
		await this.cache.invalidateStandard(orderId)

		// 8. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			locationId: order.locationId,
			module: 'pos-order',
			entity: 'order',
			entityId: orderId,
			action: 'update',
			summary: `Applied voucher "${voucherCode}" to order #${orderId} (discount: ${validation.discountAmount})`,
			newValues: { voucherCode, discountAmount: validation.discountAmount },
		})

		return { applied: true, discountAmount: validation.discountAmount }
	}

	// ─── Remove Voucher ───

	async handleRemoveVoucher(data: OrderRemoveVoucherDto, actorId: ActorId): Promise<EntityRef> {
		const { orderId } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Validate voucher is applied
		if (!order.voucherId) throw OrderError.noVoucherApplied(orderId)

		// 3. Recalculate totals without discount
		const taxRate = await this.#getTaxRate()
		const lines = await this.repo.findLinesByOrderId(orderId)
		const lineTotals = lines.map((l) => Number(l.lineTotal))
		const totals = calculateOrderTotals({ lineTotals, discountAmount: 0, taxRate })

		// 4. Update order
		const result = await this.repo.update(orderId, {
			voucherId: null,
			voucherCode: null,
			discountAmount: String(totals.discountAmount),
			taxAmount: String(totals.taxAmount),
			total: String(totals.total),
			...stampUpdate(actorId),
		})
		if (!result) throw OrderError.updateFailed(orderId)

		// 5. Invalidate cache
		await this.cache.invalidateStandard(orderId)

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			locationId: order.locationId,
			module: 'pos-order',
			entity: 'order',
			entityId: orderId,
			action: 'update',
			summary: `Removed voucher "${order.voucherCode}" from order #${orderId}`,
			oldValues: { voucherCode: order.voucherCode },
		})

		return result
	}

	// ─── Record Payment ───

	async handleRecordPayment(data: OrderPaymentDto, actorId: ActorId): Promise<EntityRef> {
		const { orderId, paymentMethodId, amount, reference } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Validate payment method available at location
		const methods = await this.deps.paymentMethodService.handleByLocation(order.locationId)
		const method = methods.find((m) => m.id === paymentMethodId)
		if (!method) throw OrderError.paymentMethodNotAvailable(paymentMethodId, order.locationId)

		// 3. Validate amount doesn't exceed remaining
		const totalPaid = await this.repo.sumPaymentsByOrderId(orderId)
		const remaining = Number(order.total) - totalPaid
		if (amount > remaining) {
			throw OrderError.paymentExceedsTotal(orderId, amount - remaining)
		}

		// 4. Insert payment
		const result = await this.repo.insertPayment({
			orderId,
			paymentMethodId,
			amount: String(amount),
			reference: reference ?? null,
		})
		if (!result) throw OrderError.paymentFailed(orderId)

		// 5. Invalidate cache
		await this.cache.invalidateStandard(orderId)

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			locationId: order.locationId,
			module: 'pos-order',
			entity: 'payment',
			entityId: result.id,
			action: 'create',
			summary: `Recorded payment of ${amount} for order #${orderId} via method #${paymentMethodId}`,
			newValues: { orderId, paymentMethodId, amount, reference },
		})

		return result
	}

	// ─── Complete ───

	async handleComplete(data: OrderCompleteDto, actorId: ActorId): Promise<EntityRef> {
		const { orderId } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Validate fully paid (or total is 0)
		const orderTotal = Number(order.total)
		if (orderTotal > 0) {
			const totalPaid = await this.repo.sumPaymentsByOrderId(orderId)
			const remaining = orderTotal - totalPaid
			if (remaining > 0) throw OrderError.notFullyPaid(orderId, remaining)
		}

		// 3. Update order status
		const result = await this.repo.update(orderId, {
			status: 'completed',
			completedAt: new Date(),
			...stampUpdate(actorId),
		})
		if (!result) throw OrderError.updateFailed(orderId)

		// 4. Increment voucher usage if applied
		if (order.voucherId) {
			await this.deps.voucherService.incrementUsage(order.voucherId)
		}

		// 5. Update table status to available
		if (order.tableId) {
			await this.deps.tableService.updateStatus(order.tableId, 'available')
		}

		// 6. Invalidate cache
		await this.cache.invalidateStandard(orderId)

		// 7. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			locationId: order.locationId,
			module: 'pos-order',
			entity: 'order',
			entityId: orderId,
			action: 'update',
			summary: `Completed order #${orderId} (${order.orderNo})`,
			oldValues: { status: 'open' },
			newValues: { status: 'completed' },
		})

		// 8. Deduct inventory stock via recipe (fire-and-forget)
		const orderLines = await this.repo.findLinesByOrderId(orderId)
		deductStockForOrder(orderId, order.locationId, orderLines, actorId, {
			recipeService: this.deps.recipeService,
			stockService: this.deps.stockService,
			uomService: this.deps.uomService,
			materialService: this.deps.materialService,
		}).catch((err) => {
			console.warn(
				`[pos:deduction] Unexpected error during stock deduction for order #${orderId}:`,
				err,
			)
		})

		return result
	}

	// ─── Void ───

	async handleVoid(data: OrderVoidDto, actorId: ActorId): Promise<EntityRef> {
		const { orderId, reason } = data

		// 1. Validate order exists and is open
		const order = await this.handleGetById(orderId)
		if (order.status !== 'open') throw OrderError.notOpen(orderId)

		// 2. Update order status
		const result = await this.repo.update(orderId, {
			status: 'voided',
			notes: reason,
			...stampUpdate(actorId),
		})
		if (!result) throw OrderError.updateFailed(orderId)

		// 3. Update table status to available
		if (order.tableId) {
			await this.deps.tableService.updateStatus(order.tableId, 'available')
		}

		// 4. Invalidate cache
		await this.cache.invalidateStandard(orderId)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			locationId: order.locationId,
			module: 'pos-order',
			entity: 'order',
			entityId: orderId,
			action: 'update',
			summary: `Voided order #${orderId} (${order.orderNo}): ${reason}`,
			oldValues: { status: 'open' },
			newValues: { status: 'voided', reason },
		})

		return result
	}

	// ─── Private ───

	async #getTaxRate(): Promise<number> {
		const settings = await this.deps.companyService.handleGetSettings()
		// taxRate is stored as percentage (e.g. 11.00 = 11%), convert to decimal
		return Number(settings.taxRate ?? 0) / 100
	}
}
