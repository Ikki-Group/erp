import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
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
	OpnameCompleteDto,
	OpnameCreateDto,
	OpnameDetailDto,
	OpnameDto,
	OpnameFilterDto,
	OpnameUpdateCountsDto,
} from './opname.contract.ts'
import { OpnameError } from './opname.internal.ts'
import type { IOpnameRepo } from './opname.repo.ts'

// ─── Dependencies ───

export interface OpnameServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	stockService: StockService
	assignmentService: AssignmentService
	locationService: LocationService
}

// ─── Service ───

export class OpnameService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IOpnameRepo,
		cacheClient: CacheClient,
		private readonly deps: OpnameServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory-opname')
	}

	// ─── Handlers ───

	async handleCreate(data: OpnameCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate location exists and get code for number generation
		const location = await this.deps.locationService.handleGetById(data.locationId)

		// 2. Get all materials assigned to this location
		const assignments = await this.deps.assignmentService.handleByLocation(data.locationId)
		if (assignments.length === 0) {
			throw OpnameError.noMaterialsAtLocation(data.locationId)
		}

		// 3. Snapshot current system qty for each material
		const lineSnapshots: Array<{ materialId: number; systemQty: string }> = []
		for (const assignment of assignments) {
			let systemQty = '0'
			try {
				const balance = await this.deps.stockService.handleGetBalance({
					materialId: assignment.materialId,
					locationId: data.locationId,
				})
				systemQty = balance.quantity
			} catch {
				// No balance record means qty=0
				systemQty = '0'
			}
			lineSnapshots.push({ materialId: assignment.materialId, systemQty })
		}

		// 4. Generate the number and insert opname + lines atomically.
		const result = await this.deps.uow.run(async (tx) => {
			const opnameNo = await generateNumber({
				prefix: 'OPN',
				locationCode: location.code,
				locationId: data.locationId,
				database: tx,
			})
			const created = await this.repo.insert(
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

			await this.repo.insertLines(
				lineSnapshots.map((snap) => ({
					opnameId: created.id,
					materialId: snap.materialId,
					systemQty: snap.systemQty,
					actualQty: snap.systemQty,
					reason: null,
				})),
				tx,
			)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'inventory',
					entity: 'stock_opname',
					entityId: created.id,
					action: 'create',
					summary: `Created opname ${opnameNo} at location #${data.locationId} (${lineSnapshots.length} materials)`,
					newValues: {
						opnameNo,
						locationId: data.locationId,
						lineCount: lineSnapshots.length,
					},
				}),
				tx,
			)

			return { created, opnameNo }
		})

		// 6. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return result.created
	}

	async handleUpdateCounts(data: OpnameUpdateCountsDto, actor: Actor): Promise<EntityRef> {
		// 1. Get opname and validate draft status
		const opname = assertFound(await this.repo.findById(data.opnameId), () =>
			OpnameError.notFound(data.opnameId),
		)

		if (opname.status === 'completed') {
			throw OpnameError.alreadyCompleted(data.opnameId)
		}
		if (opname.status !== 'draft') {
			throw OpnameError.notDraft(data.opnameId)
		}

		// 2. Validate all material lines exist in opname
		const existingLines = await this.repo.findLinesByOpnameId(data.opnameId)
		const existingMaterialIds = new Set(existingLines.map((l) => l.materialId))

		for (const line of data.lines) {
			if (!existingMaterialIds.has(line.materialId)) {
				throw OpnameError.lineNotFound(data.opnameId, line.materialId)
			}
		}

		// 3. Update counts and audit atomically
		await this.deps.uow.run(async (tx) => {
			await this.repo.updateLineCounts(
				data.opnameId,
				data.lines.map((l) => ({
					materialId: l.materialId,
					actualQty: l.countedQty,
					reason: l.reason ?? null,
				})),
				tx,
			)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'inventory',
					entity: 'stock_opname',
					entityId: data.opnameId,
					action: 'update',
					summary: `Updated counts for opname ${opname.opnameNo} (${data.lines.length} lines)`,
					newValues: { lineCount: data.lines.length },
				}),
				tx,
			)
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return { id: data.opnameId }
	}

	async handleComplete(data: OpnameCompleteDto, actor: Actor): Promise<EntityRef> {
		// 1. Get opname and validate status
		const opname = assertFound(await this.repo.findById(data.opnameId), () =>
			OpnameError.notFound(data.opnameId),
		)

		if (opname.status === 'completed') {
			throw OpnameError.alreadyCompleted(data.opnameId)
		}
		if (opname.status !== 'draft') {
			throw OpnameError.notDraft(data.opnameId)
		}

		// 2. Get all lines
		const lines = await this.repo.findLinesByOpnameId(data.opnameId)

		// 3. Apply all variance movements and complete the opname atomically.
		const { result, events } = await this.deps.uow.run(async (tx) => {
			const events: StockMovementRecorded[] = []
			for (const line of lines) {
				const systemQty = Qty.of(line.systemQty)
				const actualQty = Qty.of(line.actualQty)
				const variance = actualQty.sub(systemQty)

				if (variance.isZero()) continue

				const direction = variance.gt(Qty.zero()) ? 'in' : 'out'
				const movement = await this.deps.stockService.recordMovement(
					{
						materialId: line.materialId,
						locationId: opname.locationId,
						type: direction === 'in' ? 'adjustment_in' : 'adjustment_out',
						direction,
						qty: variance.abs().toNumeric(),
						referenceType: 'opname',
						referenceId: data.opnameId,
						notes: `Opname adjustment: ${opname.opnameNo}`,
						actorId: actor.id,
					},
					tx,
				)
				events.push(movement.event)
			}

			const result = await this.repo.updateStatus(data.opnameId, 'completed', actor.id, tx)
			if (!result) throw OpnameError.notFound(data.opnameId)
			const adjustedLines = lines.filter((l) => !Qty.of(l.actualQty).eq(Qty.of(l.systemQty)))
			await this.deps.audit.record(
				{
					actorId: actor.id,
					actorName: actor.name,
					locationId: opname.locationId,
					module: 'inventory',
					entity: 'stock_opname',
					entityId: data.opnameId,
					action: 'complete',
					summary: `Completed opname ${opname.opnameNo} (${adjustedLines.length} adjustments)`,
					newValues: { status: 'completed', adjustmentCount: adjustedLines.length },
				},
				tx,
			)
			return { result, events }
		})

		for (const event of events) this.deps.events.publish(event)
		await this.deps.stockService.invalidateCache()
		await this.cache.invalidateStandard()

		return result
	}

	async handleList(filter: OpnameFilterDto): Promise<WithPaginationResult<OpnameDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<OpnameDetailDto> {
		return assertFound(await this.repo.findDetailById(id), () => OpnameError.notFound(id))
	}
}
