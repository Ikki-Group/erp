import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { StockMovementRecorded } from '@/shared/events/stock.events.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { SupplierService } from '@/modules/supplier/supplier.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type {
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailDto,
	ReceivingDto,
	ReceivingFilterDto,
	ReceivingUpdateDto,
} from './receiving.contract.ts'
import { ReceivingError } from './receiving.internal.ts'
import type { IReceivingRepo } from './receiving.repo.ts'

// ─── Dependencies ───

export interface ReceivingServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	stockService: StockService
	assignmentService: AssignmentService
	locationService: LocationService
	materialService: MaterialService
	supplierService: SupplierService
	uomService: UomService
}

// ─── Service ───

export class ReceivingService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IReceivingRepo,
		cacheClient: CacheClient,
		private readonly deps: ReceivingServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory-receiving')
	}

	// ─── Handlers ───

	async handleCreate(data: ReceivingCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate supplier exists
		await this.deps.supplierService.handleGetById(data.supplierId)

		// 2. Validate location exists and get code for number generation
		const location = await this.deps.locationService.handleGetById(data.locationId)

		// 3. Validate each line
		for (const line of data.lines) {
			// Material must be assigned to this location
			const assigned = await this.deps.assignmentService.isAssigned(
				line.materialId,
				data.locationId,
			)
			if (!assigned) {
				throw ReceivingError.materialNotAssigned(line.materialId, data.locationId)
			}

			// UoM must be convertible to material's baseUomId
			const material = await this.deps.materialService.handleGetById(line.materialId)
			await this.#validateUomConversion(line.uomId, material.baseUomId, line.materialId)
		}

		// 5. Insert receiving + lines in transaction
		const result = await this.deps.uow.run(async (tx) => {
			const receivingNo = await generateNumber({
				prefix: 'RCV',
				locationCode: location.code,
				locationId: data.locationId,
				database: tx,
			})
			const created = await this.repo.insert(
				{
					receivingNo,
					locationId: data.locationId,
					supplierId: data.supplierId,
					status: 'draft',
					notes: data.notes ?? null,
					receivedBy: actor.id,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!created) throw ReceivingError.createFailed()

			await this.repo.insertLines(
				data.lines.map((line) => ({
					receivingId: created.id,
					materialId: line.materialId,
					quantity: line.qty,
					unitCost: line.unitCost,
					uomId: line.uomId,
				})),
				tx,
			)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'inventory',
					entity: 'receiving',
					entityId: created.id,
					action: 'create',
					summary: `Created receiving ${receivingNo} from supplier #${data.supplierId} at location #${data.locationId}`,
					newValues: {
						receivingNo,
						locationId: data.locationId,
						supplierId: data.supplierId,
						lineCount: data.lines.length,
					},
				}),
				tx,
			)

			return { created, receivingNo }
		})

		// 6. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return result.created
	}

	async handleUpdate(data: ReceivingUpdateDto, actor: Actor): Promise<EntityRef> {
		// 1. Get receiving and validate draft status
		const receiving = assertFound(await this.repo.findById(data.receivingId), () =>
			ReceivingError.notFound(data.receivingId),
		)

		if (receiving.status !== 'draft') {
			throw ReceivingError.notDraft(data.receivingId)
		}

		// 2. Validate supplier if changed
		if (data.supplierId) {
			await this.deps.supplierService.handleGetById(data.supplierId)
		}

		// 3. Validate lines if provided
		if (data.lines) {
			for (const line of data.lines) {
				const assigned = await this.deps.assignmentService.isAssigned(
					line.materialId,
					receiving.locationId,
				)
				if (!assigned) {
					throw ReceivingError.materialNotAssigned(line.materialId, receiving.locationId)
				}

				const material = await this.deps.materialService.handleGetById(line.materialId)
				await this.#validateUomConversion(line.uomId, material.baseUomId, line.materialId)
			}
		}

		// 4. Update receiving + lines in transaction
		const result = await this.deps.uow.run(async (tx) => {
			const updated = await this.repo.update(
				data.receivingId,
				{
					...(data.supplierId ? { supplierId: data.supplierId } : {}),
					...(data.notes === undefined ? {} : { notes: data.notes ?? null }),
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!updated) throw ReceivingError.notFound(data.receivingId)

			if (data.lines) {
				await this.repo.replaceLines(
					data.receivingId,
					data.lines.map((line) => ({
						receivingId: data.receivingId,
						materialId: line.materialId,
						quantity: line.qty,
						unitCost: line.unitCost,
						uomId: line.uomId,
					})),
					tx,
				)
			}

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'inventory',
					entity: 'receiving',
					entityId: data.receivingId,
					action: 'update',
					summary: `Updated receiving ${receiving.receivingNo}`,
					newValues: { supplierId: data.supplierId, lineCount: data.lines?.length },
				}),
				tx,
			)

			return updated
		})

		// 5. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return result
	}

	async handleConfirm(data: ReceivingConfirmDto, actor: Actor): Promise<EntityRef> {
		return record('receiving.confirm', async () => {
			// 1. Get receiving and validate status
			const receiving = assertFound(await this.repo.findById(data.receivingId), () =>
				ReceivingError.notFound(data.receivingId),
			)

			if (receiving.status === 'confirmed') {
				throw ReceivingError.alreadyConfirmed(data.receivingId)
			}
			if (receiving.status !== 'draft') {
				throw ReceivingError.notDraft(data.receivingId)
			}

			// 2. Get lines and apply the complete confirmation atomically.
			const { result, events } = await this.deps.uow.run(async (tx) => {
				const lines = await this.repo.findLinesByReceivingId(data.receivingId, tx)
				const events: StockMovementRecorded[] = []

				for (const line of lines) {
					const material = await this.deps.materialService.handleGetById(line.materialId)
					const conversion = await this.#resolveConversion(
						line.uomId,
						material.baseUomId,
						Qty.of(line.quantity),
					)

					const baseQty = conversion.result
					const conversionFactor = baseQty.div(Qty.of(line.quantity))
					const baseUnitCost = Money.of(line.unitCost).div(conversionFactor).toCost()

					const movement = await this.deps.stockService.recordMovement(
						{
							materialId: line.materialId,
							locationId: receiving.locationId,
							type: 'purchase_receipt',
							direction: 'in',
							qty: baseQty.toNumeric(),
							unitCost: baseUnitCost,
							referenceType: 'receiving',
							referenceId: data.receivingId,
							notes: `Receiving: ${receiving.receivingNo}`,
							actorId: actor.id,
						},
						tx,
					)
					events.push(movement.event)
				}

				const result = await this.repo.updateStatus(data.receivingId, 'confirmed', actor.id, tx)
				if (!result) throw ReceivingError.notFound(data.receivingId)
				await this.deps.audit.record(
					{
						actorId: actor.id,
						actorName: actor.name,
						locationId: receiving.locationId,
						module: 'inventory',
						entity: 'receiving',
						entityId: data.receivingId,
						action: 'confirm',
						summary: `Confirmed receiving ${receiving.receivingNo} (${lines.length} lines)`,
						newValues: { status: 'confirmed', lineCount: lines.length },
					},
					tx,
				)
				return { result, lines, events }
			})

			for (const event of events) this.deps.events.publish(event)
			await this.deps.stockService.invalidateCache()
			await this.cache.invalidateStandard()

			return result
		})
	}

	async handleList(filter: ReceivingFilterDto): Promise<WithPaginationResult<ReceivingDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<ReceivingDetailDto> {
		return assertFound(await this.repo.findDetailById(id), () => ReceivingError.notFound(id))
	}

	// ─── Private ───

	async #validateUomConversion(
		fromUomId: number,
		toUomId: number,
		materialId: number,
	): Promise<void> {
		if (fromUomId === toUomId) return // Same UoM, no conversion needed

		const conversions = await this.deps.uomService.getAllConversions()
		const { resolveConversion } = await import('@/modules/uom/domain/uom.resolver.ts')
		const resolved = resolveConversion(fromUomId, toUomId, Qty.of('1'), conversions)
		if (!resolved) {
			throw ReceivingError.uomNotConvertible(materialId, fromUomId, toUomId)
		}
	}

	async #resolveConversion(
		fromUomId: number,
		toUomId: number,
		quantity: Qty,
	): Promise<{ result: Qty }> {
		if (fromUomId === toUomId) return { result: quantity } // Identity

		const conversions = await this.deps.uomService.getAllConversions()
		const { resolveConversion } = await import('@/modules/uom/domain/uom.resolver.ts')
		const resolved = resolveConversion(fromUomId, toUomId, quantity, conversions)
		if (!resolved) {
			throw ReceivingError.uomNotConvertible(0, fromUomId, toUomId)
		}
		return { result: resolved.result }
	}
}
