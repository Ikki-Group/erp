import { vouchers } from '@/db/schema/pos.ts'

import {
	allOf,
	eq,
	eqIf,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { VoucherDto, VoucherFilterDto } from './voucher.contract.ts'

// ─── Types ───

type VoucherInsert = typeof vouchers.$inferInsert
type VoucherUpdate = Partial<Omit<VoucherInsert, 'id'>>
type VoucherRow = typeof vouchers.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: VoucherRow): VoucherDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		type: row.type,
		value: row.value,
		minPurchase: row.minPurchase,
		maxDiscount: row.maxDiscount,
		validFrom: row.validFrom,
		validUntil: row.validUntil,
		usageLimit: row.usageLimit,
		usageCount: row.usageCount,
		isActive: row.isActive === 1,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IVoucherRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<VoucherDto | undefined>
	findByCode(code: string, db?: DbContext): Promise<VoucherDto | undefined>
	findPage(filter: VoucherFilterDto, db?: DbContext): Promise<WithPaginationResult<VoucherDto>>
	insert(data: VoucherInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: VoucherUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, data: VoucherUpdate, db?: DbContext): Promise<EntityRef | undefined>
	incrementUsage(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class VoucherRepo implements IVoucherRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<VoucherDto | undefined> {
		const row = await db.select().from(vouchers).where(eq(vouchers.id, id)).limit(1).then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByCode(code: string, db: DbContext = this.db): Promise<VoucherDto | undefined> {
		const row = await db
			.select()
			.from(vouchers)
			.where(eq(vouchers.code, code))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findPage(
		filter: VoucherFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<VoucherDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: vouchers.id,
				code: vouchers.code,
				name: vouchers.name,
				type: vouchers.type,
				value: vouchers.value,
				minPurchase: vouchers.minPurchase,
				maxDiscount: vouchers.maxDiscount,
				validFrom: vouchers.validFrom,
				validUntil: vouchers.validUntil,
				usageLimit: vouchers.usageLimit,
				usageCount: vouchers.usageCount,
				isActive: vouchers.isActive,
				createdAt: vouchers.createdAt,
				updatedAt: vouchers.updatedAt,
				createdBy: vouchers.createdBy,
				updatedBy: vouchers.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(vouchers)
			.where(where)
			.orderBy(sql`${vouchers.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: VoucherInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(vouchers).values(data).returning({ id: vouchers.id })
		return result
	}

	async update(
		id: number,
		data: VoucherUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(vouchers)
			.set(data)
			.where(eq(vouchers.id, id))
			.returning({ id: vouchers.id })
		return result
	}

	async remove(
		id: number,
		data: VoucherUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(vouchers)
			.set({ ...data, isActive: 0 })
			.where(eq(vouchers.id, id))
			.returning({ id: vouchers.id })
		return result
	}

	async incrementUsage(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(vouchers)
			.set({ usageCount: sql`${vouchers.usageCount} + 1` })
			.where(eq(vouchers.id, id))
			.returning({ id: vouchers.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: VoucherFilterDto) {
		return allOf(
			searchAcross(filter.q, [vouchers.code, vouchers.name]),
			eqIf(vouchers.type, filter.type),
			filter.isActive === undefined ? undefined : eq(vouchers.isActive, filter.isActive ? 1 : 0),
		)
	}
}
