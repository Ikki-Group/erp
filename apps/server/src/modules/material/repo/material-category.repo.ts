import { and, count, eq } from 'drizzle-orm'

import { materialCategoriesTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	sortBy,
	takeFirst,
	type DbClient,
} from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import type { WithPaginationResult } from '@/types/pagination'

import type { MaterialCategory } from '../domain/material-category.entity'
import type {
	CategoryFilter,
	CategoryInsertData,
	CategoryUpdateData,
	IMaterialCategoryRepo,
} from '../domain/ports'

export class MaterialCategoryRepo implements IMaterialCategoryRepo {
	constructor(private readonly db: DbClient) {}

	async getList(): Promise<MaterialCategory[]> {
		return this.db.select().from(materialCategoriesTable).orderBy(materialCategoriesTable.name)
	}

	async getListPaginated(filter: CategoryFilter): Promise<WithPaginationResult<MaterialCategory>> {
		const { q, page, limit } = filter
		const where = and(searchFilter(materialCategoriesTable.name, q))

		return paginate<MaterialCategory>({
			data: ({ limit: l, offset }) =>
				this.db
					.select()
					.from(materialCategoriesTable)
					.where(where)
					.orderBy(sortBy(materialCategoriesTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: () => this.db.select({ count: count() }).from(materialCategoriesTable).where(where),
		})
	}

	async getById(id: number): Promise<MaterialCategory | undefined> {
		return this.db
			.select()
			.from(materialCategoriesTable)
			.where(eq(materialCategoriesTable.id, id))
			.then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(materialCategoriesTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async create(data: CategoryInsertData): Promise<{ id: number }> {
		const metadata = stampCreate(data.createdBy)
		const code = data.name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '_')
		const [result] = await this.db
			.insert(materialCategoriesTable)
			.values({
				code,
				name: data.name,
				description: data.description,
				...metadata,
			})
			.returning({ id: materialCategoriesTable.id })

		if (!result) throw new Error('Failed to create material category')
		return result
	}

	async update(id: number, data: CategoryUpdateData): Promise<{ id: number }> {
		const metadata = stampUpdate(data.updatedBy)
		const code = data.name ? data.name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '_') : undefined
		await this.db
			.update(materialCategoriesTable)
			.set({
				...(code ? { code } : {}),
				name: data.name,
				description: data.description,
				...metadata,
			})
			.where(eq(materialCategoriesTable.id, id))

		return { id }
	}

	async remove(id: number): Promise<{ id: number } | undefined> {
		const [res] = await this.db
			.delete(materialCategoriesTable)
			.where(eq(materialCategoriesTable.id, id))
			.returning({ id: materialCategoriesTable.id })

		return res
	}
}
