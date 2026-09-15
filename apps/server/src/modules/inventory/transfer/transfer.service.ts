import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
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

import type {
	TransferCreateDto,
	TransferDetailDto,
	TransferDto,
	TransferFilterDto,
	TransferReceiveDto,
	TransferShipDto,
} from './transfer.contract.ts'
import { TransferError } from './transfer.internal.ts'
import type { ITransferRepo } from './transfer.repo.ts'

// ─── Dependencies ───

export interface TransferServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	stockService: StockService
	assignmentService: AssignmentService
	locationService: LocationService
}

// ─── Service ───

export class TransferService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ITransferRepo,
		cacheClient: CacheClient,
		private readonly deps: TransferServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory-transfer')
	}

	// ─── Handlers ───

	async handleCreate(data: TransferCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate different locations
		if (data.fromLocationId === data.toLocationId) {
			throw TransferError.sameLocation()
		}

		// 2. Validate both locations exist and get source location code
		const fromLocation = await this.deps.locationService.handleGetById(data.fromLocationId)
		await this.deps.locationService.handleGetById(data.toLocationId)

		// 3. Validate all materials assigned to BOTH locations
		for (const line of data.lines) {
			const assignedSource = await this.deps.assignmentService.isAssigned(
				line.materialId,
				data.fromLocationId,
			)
			if (!assignedSource) {
				throw TransferError.materialNotAssigned(line.materialId, data.fromLocationId)
			}
			const assignedDest = await this.deps.assignmentService.isAssigned(
				line.materialId,
				data.toLocationId,
			)
			if (!assignedDest) {
				throw TransferError.materialNotAssigned(line.materialId, data.toLocationId)
			}
		}

		// 5. Insert transfer + lines
		const result = await this.deps.uow.run(async (tx) => {
			const transferNo = await generateNumber({
				prefix: 'TRF',
				locationCode: fromLocation.code,
				locationId: data.fromLocationId,
				database: tx,
			})
			const created = await this.repo.insert(
				{
					transferNo,
					fromLocationId: data.fromLocationId,
					toLocationId: data.toLocationId,
					status: 'requested',
					notes: data.notes ?? null,
					requestedBy: actor.id,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!created) throw TransferError.createFailed()

			await this.repo.insertLines(
				data.lines.map((line) => ({
					transferId: created.id,
					materialId: line.materialId,
					requestedQty: line.qty,
					uomId: line.uomId,
				})),
				tx,
			)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'inventory',
					entity: 'transfer_request',
					entityId: created.id,
					action: 'create',
					summary: `Created transfer ${transferNo} from location #${data.fromLocationId} to #${data.toLocationId}`,
					newValues: {
						transferNo,
						fromLocationId: data.fromLocationId,
						toLocationId: data.toLocationId,
						lineCount: data.lines.length,
					},
				}),
				tx,
			)

			return { created, transferNo }
		})

		// 6. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return result.created
	}

	async handleShip(data: TransferShipDto, actor: Actor): Promise<EntityRef> {
		return record('transfer.ship', async () => {
			// 1. Get transfer and validate status
			const transfer = assertFound(await this.repo.findById(data.transferId), () =>
				TransferError.notFound(data.transferId),
			)

			if (transfer.status !== 'requested') {
				throw TransferError.notRequested(data.transferId)
			}

			// 2. Apply source deductions and status changes atomically.
			const { result, events } = await this.deps.uow.run(async (tx) => {
				const lines = await this.repo.findLinesByTransferId(data.transferId, tx)
				const events: StockMovementRecorded[] = []

				for (const line of lines) {
					const movement = await this.deps.stockService.recordMovement(
						{
							materialId: line.materialId,
							locationId: transfer.fromLocationId,
							type: 'transfer_out',
							direction: 'out',
							qty: line.requestedQty,
							referenceType: 'transfer_request',
							referenceId: data.transferId,
							notes: `Transfer out: ${transfer.transferNo}`,
							actorId: actor.id,
						},
						tx,
					)
					events.push(movement.event)
					await this.repo.updateLineShipped(line.id, movement.event.costPrice, tx)
				}

				const result = await this.repo.updateStatus(data.transferId, 'in_transit', actor.id, tx)
				if (!result) throw TransferError.notFound(data.transferId)
				await this.deps.audit.record(
					{
						actorId: actor.id,
						actorName: actor.name,
						locationId: transfer.fromLocationId,
						module: 'inventory',
						entity: 'transfer_request',
						entityId: data.transferId,
						action: 'ship',
						summary: `Shipped transfer ${transfer.transferNo}`,
						newValues: { status: 'in_transit' },
					},
					tx,
				)
				return { result, events }
			})

			for (const event of events) this.deps.events.publish(event)
			await this.deps.stockService.invalidateCache()
			await this.cache.invalidateStandard()

			return result
		})
	}

	async handleReceive(data: TransferReceiveDto, actor: Actor): Promise<EntityRef> {
		return record('transfer.receive', async () => {
			// 1. Get transfer and validate status
			const transfer = assertFound(await this.repo.findById(data.transferId), () =>
				TransferError.notFound(data.transferId),
			)

			if (transfer.status === 'received') {
				throw TransferError.alreadyReceived(data.transferId)
			}
			if (transfer.status !== 'in_transit') {
				throw TransferError.notInTransit(data.transferId)
			}

			// 2. Validate and process destination receipt atomically.
			const { result, events } = await this.deps.uow.run(async (tx) => {
				const existingLines = await this.repo.findLinesByTransferId(data.transferId, tx)
				const events: StockMovementRecorded[] = []

				for (const receiveLine of data.lines) {
					const transferLine = existingLines.find((l) => l.materialId === receiveLine.materialId)
					if (!transferLine) {
						throw TransferError.lineMaterialMismatch(receiveLine.materialId)
					}

					const requestedQty = Qty.of(transferLine.requestedQty)
					const alreadyReceived = Qty.of(transferLine.receivedQty ?? '0')
					const newReceived = Qty.of(receiveLine.receivedQty)

					if (alreadyReceived.add(newReceived).gt(requestedQty)) {
						throw TransferError.receivedExceedsRequested(
							receiveLine.materialId,
							alreadyReceived.add(newReceived).toNumeric(),
							transferLine.requestedQty,
						)
					}

					const sourceCostPrice = transferLine.shippedCostPrice ?? '0'

					const movement = await this.deps.stockService.recordMovement(
						{
							materialId: receiveLine.materialId,
							locationId: transfer.toLocationId,
							type: 'transfer_in',
							direction: 'in',
							qty: receiveLine.receivedQty,
							unitCost: sourceCostPrice,
							referenceType: 'transfer_request',
							referenceId: data.transferId,
							notes: `Transfer in: ${transfer.transferNo}`,
							actorId: actor.id,
						},
						tx,
					)

					events.push(movement.event)

					const totalReceived = alreadyReceived.add(newReceived).toNumeric()
					await this.repo.updateLineReceivedQty(transferLine.id, totalReceived, tx)
				}

				const updatedLines = await this.repo.findLinesByTransferId(data.transferId, tx)
				const allFullyReceived = updatedLines.every((l) =>
					Qty.of(l.receivedQty ?? '0').gte(Qty.of(l.requestedQty)),
				)
				const newStatus = allFullyReceived ? 'received' : 'in_transit'
				const result = await this.repo.updateStatus(data.transferId, newStatus, actor.id, tx)
				if (!result) throw TransferError.notFound(data.transferId)
				await this.deps.audit.record(
					{
						actorId: actor.id,
						actorName: actor.name,
						locationId: transfer.toLocationId,
						module: 'inventory',
						entity: 'transfer_request',
						entityId: data.transferId,
						action: 'receive',
						summary: `Received transfer ${transfer.transferNo} (${newStatus})`,
						newValues: { status: newStatus, receivedLines: data.lines.length },
					},
					tx,
				)
				return { result, newStatus, events }
			})

			for (const event of events) this.deps.events.publish(event)
			await this.deps.stockService.invalidateCache()
			await this.cache.invalidateStandard()

			return result
		})
	}

	async handleList(filter: TransferFilterDto): Promise<WithPaginationResult<TransferDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<TransferDetailDto> {
		return assertFound(await this.repo.findDetailById(id), () => TransferError.notFound(id))
	}
}
