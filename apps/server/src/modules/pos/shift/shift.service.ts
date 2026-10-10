import type { Db } from '@/infra/database/index.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/index.ts'

import { reconcileShift } from './shift.calculator.ts'
import type {
	ShiftCloseDto,
	ShiftDetailDto,
	ShiftDto,
	ShiftFilterDto,
	ShiftOpenDto,
} from './shift.contract.ts'
import { ShiftError } from './shift.internal.ts'
import type { ShiftRepo } from './shift.repo.ts'

interface Deps extends Infra {
	repo: ShiftRepo
	location: Pick<LocationService, 'handleGetById'>
}

const AUDIT = { module: 'pos-shift', entity: 'cashier_shift' } as const

export class ShiftService {
	constructor(private readonly deps: Deps) {}

	getActive(userId: number, locationId: number, db?: Db): Promise<ShiftDto | undefined> {
		return this.deps.repo.findActive(userId, locationId, db)
	}

	async handleOpen(data: ShiftOpenDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, location } = this.deps
		const loc = await location.handleGetById(data.locationId)
		if (loc.type !== 'store') throw ShiftError.notStoreLocation(data.locationId)
		// Backed by the partial unique index cashier_shifts_user_location_open_uniq.
		return uow.run(async (tx) => {
			if (await repo.findActive(actor.id, data.locationId, tx)) {
				throw ShiftError.alreadyOpen(actor.id, data.locationId)
			}
			const written = await repo.insert(
				{
					locationId: data.locationId,
					userId: actor.id,
					status: 'open',
					openingCash: Money.of(data.openingCash).toAmount(),
				},
				tx,
			)
			if (!written) throw ShiftError.openFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Opened shift at location ${data.locationId} with opening cash ${data.openingCash}`,
				newValues: { locationId: data.locationId, openingCash: data.openingCash },
				locationId: data.locationId,
			})
			return written
		})
	}

	/** `canCloseOther` = caller holds `shift.close-other` (ADR-0004). */
	handleClose(data: ShiftCloseDto, actor: Actor, canCloseOther: boolean): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const shift = assertFound(await repo.findById(data.shiftId, tx), () =>
				ShiftError.notFound(data.shiftId),
			)
			if (shift.status !== 'open') throw ShiftError.notOpen(data.shiftId)
			if (shift.userId !== actor.id && !canCloseOther) {
				throw ShiftError.closeOtherDenied()
			}
			const closingCash = Money.of(data.closingCash)
			const { expectedCash, variance } = reconcileShift({
				openingCash: Money.of(shift.openingCash),
				cashPayments: Money.of(await repo.sumCashPayments(data.shiftId, tx)),
				closingCash,
			})
			const written = await repo.updateOpen(
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
			if (!written) throw ShiftError.notOpen(data.shiftId)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: data.shiftId,
				action: 'update',
				summary: `Closed shift #${data.shiftId} — closing: ${closingCash.toAmount()}, expected: ${expectedCash.toAmount()}`,
				oldValues: { status: 'open' },
				newValues: {
					status: 'closed',
					closingCash: closingCash.toAmount(),
					expectedCash: expectedCash.toAmount(),
					variance: variance.toAmount(),
				},
				locationId: shift.locationId,
			})
			return written
		})
	}

	handleList(filter: ShiftFilterDto): Promise<WithPaginationResult<ShiftDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleDetail(id: number): Promise<ShiftDetailDto> {
		return assertFound(await this.deps.repo.findDetail(id), () => ShiftError.notFound(id))
	}
}
