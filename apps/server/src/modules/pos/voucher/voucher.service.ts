import { vouchers } from '@/db/schema/pos.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { DbContext } from '@/infra/database/index.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	VoucherCreateDto,
	VoucherDto,
	VoucherFilterDto,
	VoucherUpdateDto,
	VoucherValidateResponseDto,
} from './voucher.contract.ts'
import { VoucherError, VoucherValidationReason, uniqueFields } from './voucher.internal.ts'
import type { IVoucherRepo } from './voucher.repo.ts'

// ─── Cache Keys ───

function byCodeKey(code: string): string {
	return `pos-voucher:byCode:${code}`
}

// ─── Service ───

export class VoucherService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IVoucherRepo,
		cacheClient: CacheClient,
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'pos-voucher')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<VoucherDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByCode(code: string): Promise<VoucherDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: byCodeKey(code),
			factory: () => this.repo.findByCode(code),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<VoucherDto> {
		return assertFound(await this.getById(id), () => VoucherError.notFound(id))
	}

	async handleList(filter: VoucherFilterDto): Promise<WithPaginationResult<VoucherDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: VoucherCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Check conflicts, insert, and audit atomically
		const result = await this.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: vouchers,
				pkColumn: vouchers.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert(
				{
					code: data.code,
					name: data.name,
					type: data.type,
					value: String(data.value),
					minPurchase:
						data.minPurchase === null || data.minPurchase === undefined
							? null
							: String(data.minPurchase),
					maxDiscount:
						data.maxDiscount === null || data.maxDiscount === undefined
							? null
							: String(data.maxDiscount),
					validFrom: data.validFrom,
					validUntil: data.validUntil,
					usageLimit: data.usageLimit ?? null,
					isActive: data.isActive,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw VoucherError.createFailed()

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'pos-voucher',
					entity: 'voucher',
					entityId: written.id,
					action: 'create',
					summary: `Created voucher "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type, value: data.value },
				}),
				tx,
			)
			return written
		})

		// 2. Invalidate cache after commit
		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: VoucherUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Check conflicts, update, and audit atomically
		const result = await this.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: vouchers,
				pkColumn: vouchers.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const written = await this.repo.update(
				id,
				{
					code: updateData.code,
					name: updateData.name,
					type: updateData.type,
					value: String(updateData.value),
					minPurchase:
						updateData.minPurchase === null || updateData.minPurchase === undefined
							? null
							: String(updateData.minPurchase),
					maxDiscount:
						updateData.maxDiscount === null || updateData.maxDiscount === undefined
							? null
							: String(updateData.maxDiscount),
					validFrom: updateData.validFrom,
					validUntil: updateData.validUntil,
					usageLimit: updateData.usageLimit ?? null,
					isActive: updateData.isActive,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw VoucherError.updateFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'pos-voucher',
					entity: 'voucher',
					entityId: id,
					action: 'update',
					summary: `Updated voucher "${updateData.name}" (${updateData.code})`,
					newValues: {
						code: updateData.code,
						name: updateData.name,
						type: updateData.type,
						value: updateData.value,
					},
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([byCodeKey(existing.code), byCodeKey(updateData.code)])
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete and audit atomically
		const result = await this.uow.run(async (tx) => {
			const written = await this.repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw VoucherError.deleteFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'pos-voucher',
					entity: 'voucher',
					entityId: id,
					action: 'delete',
					summary: `Deleted voucher "${existing.name}" (${existing.code})`,
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([byCodeKey(existing.code)])
		return result
	}

	// ─── Validation ───

	async handleValidate(
		code: string,
		orderTotal: string | number,
	): Promise<VoucherValidateResponseDto> {
		// 1. Find voucher by code
		const voucher = await this.getByCode(code)
		if (!voucher) {
			return { valid: false, discountAmount: '0', reason: VoucherValidationReason.NOT_FOUND }
		}

		// 2. Check active
		if (!voucher.isActive) {
			return { valid: false, discountAmount: '0', reason: VoucherValidationReason.INACTIVE }
		}

		// 3. Check date range (inclusive)
		const now = new Date()
		if (now < voucher.validFrom || now > voucher.validUntil) {
			return { valid: false, discountAmount: '0', reason: VoucherValidationReason.EXPIRED }
		}

		// 4. Check usage limit
		if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
			return {
				valid: false,
				discountAmount: '0',
				reason: VoucherValidationReason.USAGE_LIMIT_REACHED,
			}
		}

		const total = Money.of(orderTotal)
		const minPurchase = voucher.minPurchase === null ? null : Money.of(voucher.minPurchase)
		if (minPurchase !== null && total.lt(minPurchase)) {
			return {
				valid: false,
				discountAmount: '0',
				reason: VoucherValidationReason.BELOW_MIN_PURCHASE,
			}
		}

		// 5. Calculate discount with decimal-safe Money operations.
		const value = Money.of(voucher.value)
		const maxDiscount = voucher.maxDiscount === null ? null : Money.of(voucher.maxDiscount)
		let discount = voucher.type === 'percentage' ? total.percent(voucher.value) : value
		if (maxDiscount !== null && discount.gt(maxDiscount)) discount = maxDiscount

		return { valid: true, discountAmount: discount.toAmount() }
	}

	// ─── Usage Tracking (called by pos/order) ───

	async incrementUsage(id: number, db?: DbContext): Promise<void> {
		const voucher = await this.handleGetById(id)
		await this.repo.incrementUsage(id, db)

		if (!db) {
			await this.cache.invalidateStandard(id)
			await this.cache.deleteFromKeys([byCodeKey(voucher.code)])
		}
	}
}
