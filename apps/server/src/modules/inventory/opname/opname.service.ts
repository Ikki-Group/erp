import type { Db } from '@/infra/database/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
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
import { opnameAdjustment } from './opname.calculator.ts'
import { OpnameError } from './opname.internal.ts'
import type { OpnameRepo } from './opname.repo.ts'
import type {
	OpnameCompleteDto,
	OpnameCreateDto,
	OpnameDetailDto,
	OpnameDto,
	OpnameFilterDto,
	OpnameUpdateCountsDto,
} from '@ikki/contract/inventory/opname'

interface Deps extends Infra {
	repo: OpnameRepo
	stock: Pick<StockService, 'recordMovement' | 'getBalance'>
	assignment: Pick<MaterialAssignmentService, 'handleByLocation'>
	location: Pick<LocationService, 'handleGetById'>
}

const AUDIT = { module: 'inventory', entity: 'stock_opname' } as const

export class OpnameService {
	constructor(private readonly deps: Deps) {}

	handleList(filter: OpnameFilterDto, actor: Actor): Promise<WithPaginationResult<OpnameDto>> {
		return this.deps.repo.findPage({ ...filter, locationIds: actor.allowedLocations() })
	}

	async handleDetail(id: number, actor: Actor): Promise<OpnameDetailDto> {
		const detail = assertFound(await this.deps.repo.findDetailById(id), () =>
			OpnameError.notFound(id),
		)
		actor.assertCan(detail.locationId)
		return detail
	}

	/** Snapshot opname (ADR-0006 §4): records system qty now; sales keep running. */
	async handleCreate(data: OpnameCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, stock, assignment, location } = this.deps
		const loc = await location.handleGetById(data.locationId)
		const assignments = await assignment.handleByLocation(data.locationId)
		if (assignments.length === 0) throw OpnameError.noMaterialsAtLocation(data.locationId)

		return uow.run(async (tx) => {
			const snapshots: { materialId: number; systemQty: string }[] = []
			for (const { materialId } of assignments) {
				const balance = await stock.getBalance(materialId, data.locationId, tx)
				snapshots.push({ materialId, systemQty: balance?.quantity ?? '0' })
			}

			const opnameNo = await generateNumber({
				prefix: 'OPN',
				locationCode: loc.code,
				locationId: data.locationId,
				database: tx,
			})
			const created = await repo.insert(
				{
					opnameNo,
					locationId: data.locationId,
					status: 'draft',
					startedAt: new Date(),
					completedAt: null,
					conductedBy: actor.id,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!created) throw OpnameError.createFailed()
			await repo.insertLines(
				snapshots.map((snap) => ({
					opnameId: created.id,
					materialId: snap.materialId,
					systemQty: snap.systemQty,
					actualQty: snap.systemQty,
					reason: null,
				})),
				tx,
			)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: created.id,
				action: 'create',
				summary: `Created opname ${opnameNo} at location #${data.locationId} (${snapshots.length} materials)`,
				newValues: { opnameNo, locationId: data.locationId, lineCount: snapshots.length },
				locationId: data.locationId,
			})
			return created
		})
	}

	handleUpdateCounts(data: OpnameUpdateCountsDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const opname = await this.#findDraft(data.opnameId, actor, tx)
			const lines = await repo.findLinesByOpnameId(data.opnameId, tx)
			const materialIds = new Set(lines.map((l) => l.materialId))
			for (const line of data.lines) {
				if (!materialIds.has(line.materialId)) {
					throw OpnameError.lineNotFound(data.opnameId, line.materialId)
				}
			}
			await repo.updateLineCounts(
				data.opnameId,
				data.lines.map((l) => ({
					materialId: l.materialId,
					actualQty: l.countedQty,
					reason: l.reason ?? null,
				})),
				tx,
			)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: data.opnameId,
				action: 'update',
				summary: `Updated counts for opname ${opname.opnameNo} (${data.lines.length} lines)`,
				newValues: { lineCount: data.lines.length },
				locationId: opname.locationId,
			})
			return { id: data.opnameId }
		})
	}

	/** Complete: one adjustment movement per variance (cost-neutral), all in one transaction. */
	handleComplete(data: OpnameCompleteDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, stock } = this.deps
		return uow.run(async (tx) => {
			const opname = await this.#findDraft(data.opnameId, actor, tx)
			let adjustmentCount = 0
			for (const line of await repo.findLinesByOpnameId(data.opnameId, tx)) {
				const adjustment = opnameAdjustment(Qty.of(line.systemQty), Qty.of(line.actualQty))
				if (!adjustment) continue
				adjustmentCount++
				await stock.recordMovement(
					{
						materialId: line.materialId,
						locationId: opname.locationId,
						type: adjustment.type,
						direction: adjustment.direction,
						qty: adjustment.qty.toNumeric(),
						referenceType: 'opname',
						referenceId: data.opnameId,
						notes: `Opname adjustment: ${opname.opnameNo}`,
						actorId: actor.id,
					},
					tx,
				)
			}

			const result = await repo.updateStatus(data.opnameId, 'completed', actor.id, tx)
			if (!result) throw OpnameError.notFound(data.opnameId)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: data.opnameId,
				action: 'complete',
				summary: `Completed opname ${opname.opnameNo} (${adjustmentCount} adjustments)`,
				newValues: { status: 'completed', adjustmentCount },
				locationId: opname.locationId,
			})
			return result
		})
	}

	async #findDraft(id: number, actor: Actor, tx: Db): Promise<OpnameDto> {
		const opname = assertFound(await this.deps.repo.findById(id, tx), () =>
			OpnameError.notFound(id),
		)
		actor.assertCan(opname.locationId)
		if (opname.status === 'completed') throw OpnameError.alreadyCompleted(id)
		if (opname.status !== 'draft') throw OpnameError.notDraft(id)
		return opname
	}
}
