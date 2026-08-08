import { vouchers } from '@/db/schema/pos.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
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

	async handleCreate(data: VoucherCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts
		await checkConflict({
			db: this.repo.db,
			table: vouchers,
			pkColumn: vouchers.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Insert
		const result = await this.repo.insert({
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
			isActive: data.isActive ? 1 : 0,
			...stampCreate(actorId),
		})
		if (!result) throw VoucherError.createFailed()

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'pos-voucher',
			entity: 'voucher',
			entityId: result.id,
			action: 'create',
			summary: `Created voucher "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, type: data.type, value: data.value },
		})

		return result
	}

	async handleUpdate(data: VoucherUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: vouchers,
			pkColumn: vouchers.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Update
		const result = await this.repo.update(id, {
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
			isActive: updateData.isActive ? 1 : 0,
			...stampUpdate(actorId),
		})
		if (!result) throw VoucherError.updateFailed(id)

		// 4. Invalidate cache (standard + byCode for old and new code)
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([byCodeKey(existing.code), byCodeKey(updateData.code)])

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
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
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Soft-delete
		const result = await this.repo.remove(id, stampUpdate(actorId))
		if (!result) throw VoucherError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([byCodeKey(existing.code)])

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'pos-voucher',
			entity: 'voucher',
			entityId: id,
			action: 'delete',
			summary: `Deleted voucher "${existing.name}" (${existing.code})`,
		})

		return result
	}

	// ─── Validation ───

	async handleValidate(code: string, orderTotal: number): Promise<VoucherValidateResponseDto> {
		// 1. Find voucher by code
		const voucher = await this.getByCode(code)
		if (!voucher) {
			return { valid: false, discountAmount: 0, reason: VoucherValidationReason.NOT_FOUND }
		}

		// 2. Check active
		if (!voucher.isActive) {
			return { valid: false, discountAmount: 0, reason: VoucherValidationReason.INACTIVE }
		}

		// 3. Check date range (inclusive)
		const now = new Date()
		if (now < voucher.validFrom || now > voucher.validUntil) {
			return { valid: false, discountAmount: 0, reason: VoucherValidationReason.EXPIRED }
		}

		// 4. Check usage limit
		if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
			return {
				valid: false,
				discountAmount: 0,
				reason: VoucherValidationReason.USAGE_LIMIT_REACHED,
			}
		}

		// 5. Check minimum purchase
		const minPurchase = voucher.minPurchase ? Number(voucher.minPurchase) : null
		if (minPurchase !== null && orderTotal < minPurchase) {
			return { valid: false, discountAmount: 0, reason: VoucherValidationReason.BELOW_MIN_PURCHASE }
		}

		// 6. Calculate discount
		const value = Number(voucher.value)
		const maxDiscount = voucher.maxDiscount ? Number(voucher.maxDiscount) : null
		let discountAmount: number

		if (voucher.type === 'percentage') {
			const rawDiscount = (orderTotal * value) / 100
			discountAmount = maxDiscount === null ? rawDiscount : Math.min(rawDiscount, maxDiscount)
		} else {
			discountAmount = value
		}

		return { valid: true, discountAmount }
	}

	// ─── Usage Tracking (called by pos/order) ───

	async incrementUsage(id: number): Promise<void> {
		const voucher = await this.handleGetById(id)
		await this.repo.incrementUsage(id)

		// Invalidate cache
		await this.cache.invalidateStandard(id)
		await this.cache.deleteFromKeys([byCodeKey(voucher.code)])
	}
}
