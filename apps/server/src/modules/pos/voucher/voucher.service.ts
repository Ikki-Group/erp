import { vouchers } from '@/db/schema/pos.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import type { Db } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import { evaluateVoucher } from './voucher.calculator.ts'
import type {
	VoucherCreateDto,
	VoucherDto,
	VoucherFilterDto,
	VoucherUpdateDto,
	VoucherValidateResponseDto,
} from './voucher.contract.ts'
import { VoucherError, uniqueFields } from './voucher.internal.ts'
import type { VoucherRepo } from './voucher.repo.ts'

interface Deps extends Infra {
	repo: VoucherRepo
}

const AUDIT = { module: 'pos-voucher', entity: 'voucher' } as const

const optionalAmount = (v: number | null | undefined) =>
	v === null || v === undefined ? null : String(v)

function toRow(data: VoucherCreateDto) {
	return {
		code: data.code,
		name: data.name,
		type: data.type,
		value: String(data.value),
		minPurchase: optionalAmount(data.minPurchase),
		maxDiscount: optionalAmount(data.maxDiscount),
		validFrom: data.validFrom,
		validUntil: data.validUntil,
		usageLimit: data.usageLimit ?? null,
		isActive: data.isActive,
	}
}

export class VoucherService {
	constructor(private readonly deps: Deps) {}

	getByCode(code: string, db?: Db): Promise<VoucherDto | undefined> {
		return this.deps.repo.findByCode(code, db)
	}

	async handleGetById(id: number, db?: Db): Promise<VoucherDto> {
		return assertFound(await this.deps.repo.findById(id, db), () => VoucherError.notFound(id))
	}

	handleList(filter: VoucherFilterDto): Promise<WithPaginationResult<VoucherDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: VoucherCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: vouchers,
				pkColumn: vouchers.id,
				fields: uniqueFields,
				input: data,
			})
			const written = await repo.insert({ ...toRow(data), ...stampCreate(actor.id) }, tx)
			if (!written) throw VoucherError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created voucher "${data.name}" (${data.code})`,
				newValues: { code: data.code, name: data.name, type: data.type, value: data.value },
			})
			return written
		})
	}

	handleUpdate(data: VoucherUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await this.handleGetById(id, tx)
			await checkConflict({
				db: tx,
				table: vouchers,
				pkColumn: vouchers.id,
				fields: uniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(id, { ...toRow(changes), ...stampUpdate(actor.id) }, tx)
			if (!written) throw VoucherError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated voucher "${changes.name}" (${changes.code})`,
				newValues: {
					code: changes.code,
					name: changes.name,
					type: changes.type,
					value: changes.value,
				},
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await this.handleGetById(id, tx)
			const written = await repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw VoucherError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted voucher "${existing.name}" (${existing.code})`,
			})
			return written
		})
	}

	async handleValidate(code: string, orderTotal: number): Promise<VoucherValidateResponseDto> {
		return evaluateVoucher(await this.getByCode(code), Money.of(orderTotal), new Date())
	}

	/** Called by order completion inside its transaction. */
	async incrementUsage(id: number, db: Db): Promise<void> {
		const written = await this.deps.repo.incrementUsage(id, db)
		if (!written) throw VoucherError.notFound(id)
	}
}
