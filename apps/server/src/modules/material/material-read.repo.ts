/**
 * Material Read Repository — Query operations for material data
 */

import { eq, and, ilike, inArray, isNull } from 'drizzle-orm'

import type { DbClient } from '@/core/database'
import type { WithPaginationResult } from '@/core/database/pagination'

import {
	materialsTable,
	materialCategoriesTable,
	materialConversionsTable,
	materialLocationsTable,
	uomsTable,
	locationsTable,
} from '@/db/schema'

import type {
	MaterialReadFilterSchema,
	MaterialReadDetailSchema,
	MaterialReadWithRelationsSchema,
} from './material-read.schema'

export class MaterialReadRepository {
	constructor(private readonly db: DbClient) {}

	async findById(id: number): Promise<MaterialReadDetailSchema | undefined> {
		const result = await this.db
			.select()
			.from(materialsTable)
			.where(eq(materialsTable.id, id))
			.limit(1)

		return result[0] ?? undefined
	}

	async findMany(
		filter: MaterialReadFilterSchema,
	): Promise<WithPaginationResult<MaterialReadDetailSchema>> {
		const { pagination, search, type, categoryId, locationIds, excludeLocationIds } = filter
		const { limit, page } = pagination
		const offset = (page - 1) * limit

		// Build conditions array
		const conditions = []

		if (search) {
			conditions.push(
				ilike(materialsTable.name, `%${search}%`),
				ilike(materialsTable.sku, `%${search}%`),
			)
		}

		if (type) {
			conditions.push(eq(materialsTable.type, type))
		}

		if (categoryId) {
			conditions.push(eq(materialsTable.categoryId, categoryId))
		}

		// Build base query
		let query = this.db.select().from(materialsTable)

		// Apply location filters
		if (locationIds && locationIds.length > 0) {
			query = query
				.innerJoin(materialLocationsTable, eq(materialsTable.id, materialLocationsTable.materialId))
				.where(inArray(materialLocationsTable.locationId, locationIds))
		}

		if (excludeLocationIds && excludeLocationIds.length > 0) {
			query = query
				.leftJoin(
					materialLocationsTable,
					and(
						eq(materialsTable.id, materialLocationsTable.materialId),
						inArray(materialLocationsTable.locationId, excludeLocationIds),
					),
				)
				.where(isNull(materialLocationsTable.locationId))
		}

		// Apply all conditions
		if (conditions.length > 0) {
			query = query.where(and(...conditions))
		}

		// Apply pagination and get data
		const data = (await query.limit(limit).offset(offset)) as MaterialReadDetailSchema[]

		// Get total count
		let countQuery = this.db.select({ count: materialsTable.id }).from(materialsTable)

		if (conditions.length > 0) {
			countQuery = countQuery.where(and(...conditions))
		}

		const countResult = await countQuery
		const total = (countResult[0] as any)?.count ?? 0

		return {
			data,
			meta: {
				limit,
				page,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	async findWithRelations(id: number): Promise<MaterialReadWithRelationsSchema | undefined> {
		// Get material
		const materialResult = await this.db
			.select()
			.from(materialsTable)
			.where(eq(materialsTable.id, id))
			.limit(1)

		const material = materialResult[0]
		if (!material) return undefined

		// Get category if exists
		let category = null
		if (material.categoryId) {
			const categoryResult = await this.db
				.select()
				.from(materialCategoriesTable)
				.where(eq(materialCategoriesTable.id, material.categoryId))
				.limit(1)

			category = categoryResult[0] ?? null
		}

		// Get conversions with UOM
		const conversionResult = await this.db
			.select()
			.from(materialConversionsTable)
			.where(eq(materialConversionsTable.materialId, id))

		const conversions = await Promise.all(
			conversionResult.map(async (conv) => {
				const uomResult = await this.db
					.select()
					.from(uomsTable)
					.where(eq(uomsTable.id, conv.uomId))
					.limit(1)

				const uom = uomResult[0]

				return {
					id: conv.id,
					materialId: conv.materialId,
					uomId: conv.uomId,
					toBaseFactor: conv.toBaseFactor,
					createdAt: conv.createdAt,
					updatedAt: conv.updatedAt,
					createdBy: conv.createdBy,
					updatedBy: conv.updatedBy,
					uom: uom ?? null,
				}
			}),
		)

		// Get locations
		const locationResult = await this.db
			.select({
				id: locationsTable.id,
				name: locationsTable.name,
				code: locationsTable.code,
				address: locationsTable.address,
				type: locationsTable.type,
				createdAt: locationsTable.createdAt,
				updatedAt: locationsTable.updatedAt,
				createdBy: locationsTable.createdBy,
				updatedBy: locationsTable.updatedBy,
			})
			.from(materialLocationsTable)
			.leftJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
			.where(eq(materialLocationsTable.materialId, id))

		const locations = locationResult.map((loc) => ({
			id: loc.id,
			name: loc.name,
			code: loc.code,
			address: loc.address,
			type: loc.type,
			createdAt: loc.createdAt,
			updatedAt: loc.updatedAt,
			createdBy: loc.createdBy,
			updatedBy: loc.updatedBy,
		}))

		return {
			...material,
			category: category
				? {
						id: category.id,
						name: category.name,
						description: category.description,
						createdAt: category.createdAt,
						updatedAt: category.updatedAt,
						createdBy: category.createdBy,
						updatedBy: category.updatedBy,
					}
				: null,
			conversions,
			locations,
		}
	}
}
