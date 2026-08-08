import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { requirePermission } from '@/shared/auth/permission.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
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

	async handleOpen(data: ShiftOpenDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate location is store type
		const location = await this.locationService.handleGetById(data.locationId)
		if (location.type !== 'store') {
			throw ShiftError.notStoreLocation(data.locationId)
		}

		// 2. Check no existing open shift for this user at this location
		const existing = await this.repo.findActive(actorId, data.locationId)
		if (existing) {
			throw ShiftError.alreadyOpen(actorId, data.locationId)
		}

		// 3. Insert shift
		const result = await this.repo.insert({
			locationId: data.locationId,
			userId: actorId,
			status: 'open',
			openingCash: String(data.openingCash),
		})
		if (!result) throw ShiftError.openFailed()

		// 4. Invalidate cache
		await this.cache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			locationId: data.locationId,
			module: 'pos-shift',
			entity: 'cashier_shift',
			entityId: result.id,
			action: 'create',
			summary: `Opened shift at location ${data.locationId} with opening cash ${data.openingCash}`,
			newValues: { locationId: data.locationId, openingCash: data.openingCash },
		})

		return result
	}

	async handleClose(data: ShiftCloseDto, auth: AuthContext): Promise<EntityRef> {
		// 1. Find shift, assert found and open
		const shift = assertFound(
			await this.repo.findById(data.shiftId),
			() => ShiftError.notFound(data.shiftId),
		)
		if (shift.status !== 'open') {
			throw ShiftError.notOpen(data.shiftId)
		}

		// 2. Check ownership — own shift or requires close-other permission
		if (shift.userId !== auth.userId) {
			requirePermission(auth, 'pos:shift:close-other')
		}

		// 3. Calculate expected cash
		const cashPayments = await this.repo.sumCashPayments(data.shiftId)
		const expectedCash = Number(shift.openingCash) + cashPayments

		// 4. Update shift
		const result = await this.repo.update(data.shiftId, {
			status: 'closed',
			closedAt: new Date(),
			closingCash: String(data.closingCash),
			expectedCash: String(expectedCash),
			notes: data.notes ?? null,
		})
		if (!result) throw ShiftError.closeFailed(data.shiftId)

		// 5. Invalidate cache
		await this.cache.invalidateStandard(data.shiftId)

		// 6. Audit log
		auditLog.record({
			userId: auth.userId,
			userName: '',
			locationId: shift.locationId,
			module: 'pos-shift',
			entity: 'cashier_shift',
			entityId: data.shiftId,
			action: 'update',
			summary: `Closed shift #${data.shiftId} — closing: ${data.closingCash}, expected: ${expectedCash}`,
			oldValues: { status: 'open' },
			newValues: {
				status: 'closed',
				closingCash: data.closingCash,
				expectedCash,
				variance: data.closingCash - expectedCash,
			},
		})

		return result
	}

	async handleGetActive(userId: number, locationId: number): Promise<ShiftDto | null> {
		const shift = await this.repo.findActive(userId, locationId)
		return shift ?? null
	}

	async handleList(filter: ShiftFilterDto): Promise<WithPaginationResult<ShiftDto>> {
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<ShiftDetailDto> {
		const detail = await this.repo.findDetail(id)
		return assertFound(detail, () => ShiftError.notFound(id))
	}
}
