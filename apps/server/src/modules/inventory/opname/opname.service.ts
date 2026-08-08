import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { withTransaction } from '@/infra/database/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { stampCreate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'
import { roundQty, toDecimal } from '@/shared/utils/money.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import type {
	OpnameApproveDto,
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

	async handleCreate(data: OpnameCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate location exists and get code for number generation
		const location = await this.deps.locationService.handleGetById(data.locationId)

		// 2. Get all materials assigned to this location
		const assignments = await this.deps.assignmentService.handleByLocation(data.locationId)
		if (assignments.length === 0) {
			throw OpnameError.noMaterialsAtLocation(data.locationId)
		}

		// 3. Generate opname number
		const opnameNo = await generateNumber({
			prefix: 'OPN',
			locationCode: location.code,
			locationId: data.locationId,
		})

		// 4. Snapshot current system qty for each material
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

		// 5. Insert opname + lines in transaction
		const result = await withTransaction(this.repo.db, async (tx) => {
			const created = await this.repo.insert(
				{
					opnameNo,
					locationId: data.locationId,
					status: 'draft',
					startedAt: new Date(),
					completedAt: null,
					conductedBy: actorId,
					...stampCreate(actorId),
				},
				tx,
			)
			if (!created) throw OpnameError.createFailed()

			await this.repo.insertLines(
				lineSnapshots.map((snap) => ({
					opnameId: created.id,
					materialId: snap.materialId,
					systemQty: snap.systemQty,
					actualQty: snap.systemQty, // Default actualQty = systemQty (no variance until counted)
					reason: null,
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
			entity: 'stock_opname',
			entityId: result.id,
			action: 'create',
			summary: `Created opname ${opnameNo} at location #${data.locationId} (${lineSnapshots.length} materials)`,
			newValues: {
				opnameNo,
				locationId: data.locationId,
				lineCount: lineSnapshots.length,
			},
		})

		return result
	}

	async handleUpdateCounts(data: OpnameUpdateCountsDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Get opname and validate draft status
		const opname = assertFound(await this.repo.findById(data.opnameId), () =>
			OpnameError.notFound(data.opnameId),
		)

		if (opname.status === 'completed') {
			throw OpnameError.alreadyApproved(data.opnameId)
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

		// 3. Update counts
		await this.repo.updateLineCounts(
			data.opnameId,
			data.lines.map((l) => ({
				materialId: l.materialId,
				actualQty: l.countedQty,
				reason: l.reason ?? null,
			})),
		)

		// 4. Invalidate cache
		await this.cache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'inventory',
			entity: 'stock_opname',
			entityId: data.opnameId,
			action: 'update',
			summary: `Updated counts for opname ${opname.opnameNo} (${data.lines.length} lines)`,
			newValues: { lineCount: data.lines.length },
		})

		return { id: data.opnameId }
	}

	async handleApprove(data: OpnameApproveDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Get opname and validate status
		const opname = assertFound(await this.repo.findById(data.opnameId), () =>
			OpnameError.notFound(data.opnameId),
		)

		if (opname.status === 'completed') {
			throw OpnameError.alreadyApproved(data.opnameId)
		}
		if (opname.status !== 'draft') {
			throw OpnameError.notDraft(data.opnameId)
		}

		// 2. Get all lines
		const lines = await this.repo.findLinesByOpnameId(data.opnameId)

		// 3. For each line with variance, record stock adjustment
		for (const line of lines) {
			const systemQty = toDecimal(line.systemQty)
			const actualQty = toDecimal(line.actualQty)
			const variance = actualQty.sub(systemQty)

			if (variance.isZero()) continue // No adjustment needed

			const direction = variance.gt(0) ? 'in' : 'out'
			const qty = roundQty(variance.abs())

			await this.deps.stockService.recordMovement({
				materialId: line.materialId,
				locationId: opname.locationId,
				type: 'opname',
				direction,
				qty,
				// No unitCost — opname doesn't change cost, only quantity
				referenceType: 'opname',
				referenceId: data.opnameId,
				notes: `Opname adjustment: ${opname.opnameNo}`,
				actorId,
			})
		}

		// 4. Update status to approved (using 'completed' in DB enum)
		const result = await this.repo.updateStatus(data.opnameId, 'completed', actorId)
		if (!result) throw OpnameError.notFound(data.opnameId)

		// 5. Invalidate cache
		await this.cache.invalidateStandard()

		// 6. Audit log
		const adjustedLines = lines.filter((l) => !toDecimal(l.actualQty).eq(toDecimal(l.systemQty)))
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'inventory',
			entity: 'stock_opname',
			entityId: data.opnameId,
			action: 'update',
			summary: `Approved opname ${opname.opnameNo} (${adjustedLines.length} adjustments)`,
			newValues: { status: 'approved', adjustmentCount: adjustedLines.length },
		})

		return result
	}

	async handleList(filter: OpnameFilterDto): Promise<WithPaginationResult<OpnameDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<OpnameDetailDto> {
		return assertFound(await this.repo.findDetailById(id), () => OpnameError.notFound(id))
	}
}
