import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { stampCreate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/index.ts'
import type { MaterialAssignmentService } from '@/modules/material/index.ts'

import type { StockService } from '../stock/stock.service.ts'
import { isFullyReceived, nextReceivedQty } from './transfer.calculator.ts'
import type {
	TransferCreateDto,
	TransferDetailDto,
	TransferDto,
	TransferFilterDto,
	TransferReceiveDto,
	TransferShipDto,
} from './transfer.contract.ts'
import { TransferError } from './transfer.internal.ts'
import type { TransferRepo } from './transfer.repo.ts'

interface Deps extends Infra {
	repo: TransferRepo
	stock: Pick<StockService, 'recordMovement'>
	assignment: Pick<MaterialAssignmentService, 'isAssigned'>
	location: Pick<LocationService, 'handleGetById'>
}

const AUDIT = { module: 'inventory', entity: 'transfer_request' } as const

export class TransferService {
	constructor(private readonly deps: Deps) {}

	handleList(filter: TransferFilterDto): Promise<WithPaginationResult<TransferDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<TransferDetailDto> {
		return assertFound(await this.deps.repo.findDetailById(id), () => TransferError.notFound(id))
	}

	async handleCreate(data: TransferCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, assignment, location } = this.deps
		if (data.fromLocationId === data.toLocationId) throw TransferError.sameLocation()
		const fromLocation = await location.handleGetById(data.fromLocationId)
		await location.handleGetById(data.toLocationId)
		for (const line of data.lines) {
			for (const locationId of [data.fromLocationId, data.toLocationId]) {
				if (!(await assignment.isAssigned(line.materialId, locationId))) {
					throw TransferError.materialNotAssigned(line.materialId, locationId)
				}
			}
		}

		return uow.run(async (tx) => {
			const transferNo = await generateNumber({
				prefix: 'TRF',
				locationCode: fromLocation.code,
				locationId: data.fromLocationId,
				database: tx,
			})
			const created = await repo.insert(
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
			await repo.insertLines(
				data.lines.map((line) => ({
					transferId: created.id,
					materialId: line.materialId,
					requestedQty: line.qty,
					uomId: line.uomId,
				})),
				tx,
			)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: created.id,
				action: 'create',
				summary: `Created transfer ${transferNo} from location #${data.fromLocationId} to #${data.toLocationId}`,
				newValues: {
					transferNo,
					fromLocationId: data.fromLocationId,
					toLocationId: data.toLocationId,
					lineCount: data.lines.length,
				},
				locationId: data.fromLocationId,
			})
			return created
		})
	}

	/** Ship: source stock leaves (checked), carrying the source cost (ADR-0010 §4). */
	handleShip(data: TransferShipDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, stock } = this.deps
		return record('transfer.ship', () =>
			uow.run(async (tx) => {
				const transfer = assertFound(await repo.findById(data.transferId, tx), () =>
					TransferError.notFound(data.transferId),
				)
				if (transfer.status !== 'requested') throw TransferError.notRequested(data.transferId)

				for (const line of await repo.findLinesByTransferId(data.transferId, tx)) {
					const movement = await stock.recordMovement(
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
					await repo.updateLineShipped(line.id, movement.costPrice, tx)
				}

				const result = await repo.updateStatus(data.transferId, 'in_transit', actor.id, tx)
				if (!result) throw TransferError.notFound(data.transferId)
				await audit.record(tx, actor, {
					...AUDIT,
					entityId: data.transferId,
					action: 'ship',
					summary: `Shipped transfer ${transfer.transferNo}`,
					newValues: { status: 'in_transit' },
					locationId: transfer.fromLocationId,
				})
				return result
			}),
		)
	}

	/** Receive: destination stock arrives at the shipped cost (permissive). Partial receipts allowed. */
	handleReceive(data: TransferReceiveDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, stock } = this.deps
		return record('transfer.receive', () =>
			uow.run(async (tx) => {
				const transfer = assertFound(await repo.findById(data.transferId, tx), () =>
					TransferError.notFound(data.transferId),
				)
				if (transfer.status === 'received') throw TransferError.alreadyReceived(data.transferId)
				if (transfer.status !== 'in_transit') throw TransferError.notInTransit(data.transferId)

				const lines = await repo.findLinesByTransferId(data.transferId, tx)
				for (const receiveLine of data.lines) {
					const line = lines.find((l) => l.materialId === receiveLine.materialId)
					if (!line) throw TransferError.lineMaterialMismatch(receiveLine.materialId)

					const incoming = Qty.of(receiveLine.receivedQty)
					const already = Qty.of(line.receivedQty ?? '0')
					const total = nextReceivedQty(Qty.of(line.requestedQty), already, incoming)
					if (!total) {
						throw TransferError.receivedExceedsRequested(
							receiveLine.materialId,
							already.add(incoming).toNumeric(),
							line.requestedQty,
						)
					}

					await stock.recordMovement(
						{
							materialId: receiveLine.materialId,
							locationId: transfer.toLocationId,
							type: 'transfer_in',
							direction: 'in',
							qty: receiveLine.receivedQty,
							unitCost: line.shippedCostPrice ?? '0',
							referenceType: 'transfer_request',
							referenceId: data.transferId,
							notes: `Transfer in: ${transfer.transferNo}`,
							actorId: actor.id,
						},
						tx,
					)
					await repo.updateLineReceivedQty(line.id, total.toNumeric(), tx)
					// Keep the in-memory line current so a repeated material accumulates correctly.
					line.receivedQty = total.toNumeric()
				}

				const newStatus = isFullyReceived(lines) ? 'received' : 'in_transit'
				const result = await repo.updateStatus(data.transferId, newStatus, actor.id, tx)
				if (!result) throw TransferError.notFound(data.transferId)
				await audit.record(tx, actor, {
					...AUDIT,
					entityId: data.transferId,
					action: 'receive',
					summary: `Received transfer ${transfer.transferNo} (${newStatus})`,
					newValues: { status: newStatus, receivedLines: data.lines.length },
					locationId: transfer.toLocationId,
				})
				return result
			}),
		)
	}
}
