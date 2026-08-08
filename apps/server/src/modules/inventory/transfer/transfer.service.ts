import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { withTransaction } from '@/infra/database/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { stampCreate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'
import { roundQty, toDecimal } from '@/shared/utils/money.ts'

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

	async handleCreate(data: TransferCreateDto, actorId: ActorId): Promise<EntityRef> {
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

		// 4. Generate transfer number
		const transferNo = await generateNumber({
			prefix: 'TRF',
			locationCode: fromLocation.code,
			locationId: data.fromLocationId,
		})

		// 5. Insert transfer + lines
		const result = await withTransaction(this.repo.db, async (tx) => {
			const created = await this.repo.insert(
				{
					transferNo,
					fromLocationId: data.fromLocationId,
					toLocationId: data.toLocationId,
					status: 'requested',
					notes: data.notes ?? null,
					requestedBy: actorId,
					...stampCreate(actorId),
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

			return created
		})

		// 6. Invalidate cache
		await this.cache.invalidateStandard()

		// 7. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'inventory',
			entity: 'transfer_request',
			entityId: result.id,
			action: 'create',
			summary: `Created transfer ${transferNo} from location #${data.fromLocationId} to #${data.toLocationId}`,
			newValues: {
				transferNo,
				fromLocationId: data.fromLocationId,
				toLocationId: data.toLocationId,
				lineCount: data.lines.length,
			},
		})

		return result
	}

	async handleShip(data: TransferShipDto, actorId: ActorId): Promise<EntityRef> {
		return record('transfer.ship', async () => {
			// 1. Get transfer and validate status
			const transfer = assertFound(await this.repo.findById(data.transferId), () =>
				TransferError.notFound(data.transferId),
			)

			if (transfer.status !== 'requested') {
				throw TransferError.notRequested(data.transferId)
			}

			// 2. Get lines
			const lines = await this.repo.findLinesByTransferId(data.transferId)

			// 3. Deduct stock at source for each line
			for (const line of lines) {
				await this.deps.stockService.recordMovement({
					materialId: line.materialId,
					locationId: transfer.fromLocationId,
					type: 'transfer_out',
					direction: 'out',
					qty: line.requestedQty,
					referenceType: 'transfer_request',
					referenceId: data.transferId,
					notes: `Transfer out: ${transfer.transferNo}`,
					actorId,
				})
			}

			// 4. Update status + set shipped qty
			await this.repo.updateLineShippedQty(data.transferId)
			const result = await this.repo.updateStatus(data.transferId, 'in_transit', actorId)
			if (!result) throw TransferError.notFound(data.transferId)

			// 5. Invalidate cache
			await this.cache.invalidateStandard()

			// 6. Audit log
			auditLog.record({
				userId: actorId,
				userName: '',
				module: 'inventory',
				entity: 'transfer_request',
				entityId: data.transferId,
				action: 'update',
				summary: `Shipped transfer ${transfer.transferNo}`,
				newValues: { status: 'in_transit' },
			})

			return result
		})
	}

	async handleReceive(data: TransferReceiveDto, actorId: ActorId): Promise<EntityRef> {
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

			// 2. Get existing lines
			const existingLines = await this.repo.findLinesByTransferId(data.transferId)

			// 3. Validate and process each receive line
			for (const receiveLine of data.lines) {
				const transferLine = existingLines.find((l) => l.materialId === receiveLine.materialId)
				if (!transferLine) {
					throw TransferError.lineMaterialMismatch(receiveLine.materialId)
				}

				// Validate received qty does not exceed requested
				const requestedQty = toDecimal(transferLine.requestedQty)
				const alreadyReceived = toDecimal(transferLine.receivedQty ?? '0')
				const newReceived = toDecimal(receiveLine.receivedQty)

				if (alreadyReceived.add(newReceived).gt(requestedQty)) {
					throw TransferError.receivedExceedsRequested(
						receiveLine.materialId,
						alreadyReceived.add(newReceived).toString(),
						transferLine.requestedQty,
					)
				}

				// Get source cost price for weighted avg at destination
				const sourceCostPrice = await this.#getSourceCostPrice(
					transferLine.materialId,
					transfer.fromLocationId,
				)

				// Record movement at destination
				await this.deps.stockService.recordMovement({
					materialId: receiveLine.materialId,
					locationId: transfer.toLocationId,
					type: 'transfer_in',
					direction: 'in',
					qty: receiveLine.receivedQty,
					unitCost: sourceCostPrice,
					referenceType: 'transfer_request',
					referenceId: data.transferId,
					notes: `Transfer in: ${transfer.transferNo}`,
					actorId,
				})

				// Update line received qty
				const totalReceived = roundQty(alreadyReceived.add(newReceived))
				await this.repo.updateLineReceivedQty(transferLine.id, totalReceived)
			}

			// 4. Determine final status: received if all lines fully received
			const updatedLines = await this.repo.findLinesByTransferId(data.transferId)
			const allFullyReceived = updatedLines.every((l) =>
				toDecimal(l.receivedQty ?? '0').gte(toDecimal(l.requestedQty)),
			)
			const newStatus = allFullyReceived ? 'received' : 'in_transit'

			// 5. Update status
			const result = await this.repo.updateStatus(data.transferId, newStatus, actorId)
			if (!result) throw TransferError.notFound(data.transferId)

			// 6. Invalidate cache
			await this.cache.invalidateStandard()

			// 7. Audit log
			auditLog.record({
				userId: actorId,
				userName: '',
				module: 'inventory',
				entity: 'transfer_request',
				entityId: data.transferId,
				action: 'update',
				summary: `Received transfer ${transfer.transferNo} (${newStatus})`,
				newValues: { status: newStatus, receivedLines: data.lines.length },
			})

			return result
		})
	}

	async handleList(filter: TransferFilterDto): Promise<WithPaginationResult<TransferDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<TransferDetailDto> {
		return assertFound(await this.repo.findDetailById(id), () => TransferError.notFound(id))
	}

	// ─── Private ───

	async #getSourceCostPrice(materialId: number, fromLocationId: number): Promise<string> {
		// Get the balance at source to determine cost price for weighted avg
		try {
			const balance = await this.deps.stockService.handleGetBalance({
				materialId,
				locationId: fromLocationId,
			})
			return balance.costPrice
		} catch {
			// If balance not found (already fully depleted), use 0
			return '0'
		}
	}
}
