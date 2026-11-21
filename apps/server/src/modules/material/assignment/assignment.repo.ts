import { materialLocations } from '@/db/schema/material.ts'

import { eq, and, takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { MaterialLocationDto } from './assignment.contract.ts'

// ─── Types ───

type AssignmentInsert = typeof materialLocations.$inferInsert
type AssignmentRow = typeof materialLocations.$inferSelect

function toDto(row: AssignmentRow): MaterialLocationDto {
	return {
		id: row.id,
		materialId: row.materialId,
		locationId: row.locationId,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IAssignmentRepo {
	readonly db: DbContext
	findOne(
		materialId: number,
		locationId: number,
		db?: DbContext,
	): Promise<MaterialLocationDto | undefined>
	findByMaterialId(materialId: number, db?: DbContext): Promise<MaterialLocationDto[]>
	findByLocationId(locationId: number, db?: DbContext): Promise<MaterialLocationDto[]>
	insert(data: AssignmentInsert, db?: DbContext): Promise<EntityRef | undefined>
	remove(materialId: number, locationId: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class AssignmentRepo implements IAssignmentRepo {
	constructor(readonly db: DbContext) {}

	async findOne(
		materialId: number,
		locationId: number,
		db: DbContext = this.db,
	): Promise<MaterialLocationDto | undefined> {
		const row = await db
			.select()
			.from(materialLocations)
			.where(
				and(
					eq(materialLocations.materialId, materialId),
					eq(materialLocations.locationId, locationId),
				),
			)
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByMaterialId(
		materialId: number,
		db: DbContext = this.db,
	): Promise<MaterialLocationDto[]> {
		const rows = await db
			.select()
			.from(materialLocations)
			.where(eq(materialLocations.materialId, materialId))
		return rows.map(toDto)
	}

	async findByLocationId(
		locationId: number,
		db: DbContext = this.db,
	): Promise<MaterialLocationDto[]> {
		const rows = await db
			.select()
			.from(materialLocations)
			.where(eq(materialLocations.locationId, locationId))
		return rows.map(toDto)
	}

	async insert(data: AssignmentInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(materialLocations)
			.values(data)
			.returning({ id: materialLocations.id })
		return result
	}

	async remove(
		materialId: number,
		locationId: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(materialLocations)
			.where(
				and(
					eq(materialLocations.materialId, materialId),
					eq(materialLocations.locationId, locationId),
				),
			)
			.returning({ id: materialLocations.id })
		return result
	}
}
