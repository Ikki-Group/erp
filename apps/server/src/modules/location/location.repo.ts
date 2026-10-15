import { and, ne } from 'drizzle-orm'

import { locations } from '@/db/schema/core.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { SoftDeleteCrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, eqIf, eq, searchAcross, takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { LocationDto, LocationFilterDto } from './location.contract.ts'
import { LocationError } from './location.internal.ts'

// ─── Types ───

type LocationInsert = typeof locations.$inferInsert
type LocationRow = typeof locations.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: LocationRow): LocationDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		type: row.type,
		address: row.address,
		phone: row.phone,
		isActive: row.isActive,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ILocationRepo extends SoftDeleteCrudRepo<LocationDto, LocationInsert> {
	findPage(filter: LocationFilterDto, db?: DbContext): Promise<WithPaginationResult<LocationDto>>
	assertNoConflict(
		data: { code: string; name: string },
		excludeId: number | undefined,
		db: DbContext,
	): Promise<void>
}

// ─── Implementation ───

export function createLocationRepo(baseDb: DbContext): ILocationRepo {
	const crud = createCrudRepo({ db: baseDb, table: locations, toDto, softDelete: true })
	const isActive = eq(locations.isActive, true)

	return {
		...crud,

		// Soft-deleted locations are hidden from single and full-list reads.
		async findById(id, db = baseDb) {
			const row = await db
				.select()
				.from(locations)
				.where(and(eq(locations.id, id), isActive))
				.limit(1)
				.then(takeFirst)
			return row ? toDto(row) : undefined
		},

		async findMany(db = baseDb) {
			const rows = await db.select().from(locations).where(isActive)
			return rows.map(toDto)
		},

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						isActive,
						searchAcross(filter.q, [locations.code, locations.name]),
						eqIf(locations.type, filter.type),
					),
				},
				db,
			),

		async assertNoConflict(data, excludeId, db) {
			const notSelf = excludeId ? ne(locations.id, excludeId) : undefined
			const byCode = await db
				.select({ id: locations.id })
				.from(locations)
				.where(and(eq(locations.code, data.code), notSelf))
				.limit(1)
				.then(takeFirst)
			if (byCode) throw LocationError.codeExists()

			const byName = await db
				.select({ id: locations.id })
				.from(locations)
				.where(and(eq(locations.name, data.name), notSelf))
				.limit(1)
				.then(takeFirst)
			if (byName) throw LocationError.nameExists()
		},
	}
}
