import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import type {
	ShiftCloseDto,
	ShiftDetailDto,
	ShiftDto,
	ShiftFilterDto,
	ShiftOpenDto,
} from './shift.contract.ts'
import { ShiftError } from './shift.internal.ts'
import type { IShiftRepo } from './shift.repo.ts'

// ─── Service ───

export class ShiftService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IShiftRepo,
		cacheClient: CacheClient,
		private readonly locationService: LocationService,
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'pos-shift')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<ShiftDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	// ─── Handlers ───

	async handleOpen(data: ShiftOpenDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate location is store type
		const location = await this.locationService.handleGetById(data.locationId)
		if (location.type !== 'store') {
			throw ShiftError.notStoreLocation(data.locationId)
		}

		// 2. Check no existing open shift for this user at this location
		const existing = await this.repo.findActive(actor.id, data.locationId)
		if (existing) {
			throw ShiftError.alreadyOpen(actor.id, data.locationId)
		}

		// 3. Insert shift and audit atomically
		const result = await this.uow.run(async (tx) => {
			const written = await this.repo.insert(
				{
					locationId: data.locationId,
					userId: actor.id,
					status: 'open',
					openingCash: String(data.openingCash),
				},
				tx,
			)
			if (!written) throw ShiftError.openFailed()

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'pos-shift',
					entity: 'cashier_shift',
					entityId: written.id,
					action: 'create',
					summary: `Opened shift at location ${data.locationId} with opening cash ${data.openingCash}`,
					newValues: { locationId: data.locationId, openingCash: data.openingCash },
				}),
				tx,
			)
			return written
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard()
		return result
	}

	async handleClose(data: ShiftCloseDto, actor: Actor): Promise<EntityRef> {
		// 1. Find shift, assert found and open
		const shift = assertFound(await this.repo.findById(data.shiftId), () =>
			ShiftError.notFound(data.shiftId),
		)
		actor.assertCan(shift.locationId)
		if (shift.status !== 'open') {
			throw ShiftError.notOpen(data.shiftId)
		}

		// 2. Check ownership — own shift or requires close-other permission at its location
		if (shift.userId !== actor.id) actor.assertCan(shift.locationId, 'shift.close-other')

		// 3. Update shift and audit atomically
		const result = await this.uow.run(async (tx) => {
			const current = assertFound(await this.repo.findById(data.shiftId, tx), () =>
				ShiftError.notFound(data.shiftId),
			)
			if (current.status !== 'open') throw ShiftError.notOpen(data.shiftId)

			const cashPayments = await this.repo.sumCashPayments(data.shiftId, tx)
			const expectedCash = Money.of(current.openingCash).add(Money.of(cashPayments))
			const closingCash = Money.of(String(data.closingCash))
			const written = await this.repo.update(
				data.shiftId,
				{
					status: 'closed',
					closedAt: new Date(),
					closingCash: closingCash.toAmount(),
					expectedCash: expectedCash.toAmount(),
					notes: data.notes ?? null,
				},
				tx,
			)
			if (!written) throw ShiftError.closeFailed(data.shiftId)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'pos-shift',
					entity: 'cashier_shift',
					entityId: data.shiftId,
					action: 'update',
					summary: `Closed shift #${data.shiftId} — closing: ${closingCash.toAmount()}, expected: ${expectedCash.toAmount()}`,
					oldValues: { status: 'open' },
					newValues: {
						status: 'closed',
						closingCash: closingCash.toAmount(),
						expectedCash: expectedCash.toAmount(),
						variance: closingCash.sub(expectedCash).toAmount(),
					},
				}),
				tx,
			)
			return written
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard(data.shiftId)
		return result
	}

	/** The user's open shift at a location (used by order creation). */
	async findActive(userId: number, locationId: number): Promise<ShiftDto | null> {
		return (await this.repo.findActive(userId, locationId)) ?? null
	}

	/** The actor's open shift at the active location; null when no location is selected. */
	handleGetActive(actor: Actor): Promise<ShiftDto | null> {
		return actor.locationId === null
			? Promise.resolve(null)
			: this.findActive(actor.id, actor.locationId)
	}

	async handleList(filter: ShiftFilterDto): Promise<WithPaginationResult<ShiftDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number, actor: Actor): Promise<ShiftDetailDto> {
		const detail = assertFound(await this.repo.findDetail(id), () => ShiftError.notFound(id))
		actor.assertCan(detail.locationId)
		return detail
	}
}
