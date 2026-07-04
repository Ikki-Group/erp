import { and, count, eq, ilike, inArray, not, or, type SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import {
	productPricesTable,
	productsTable,
	productVariantsTable,
	productVariantPricesTable,
} from '@/db/schema'

import { paginate, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import {
	ProductDto,
	type ProductFilterDto,
	type ProductPriceDto,
	type ProductVariantDto,
	type VariantPriceDto,
} from './product.contract'

type ProductInsert = typeof productsTable.$inferInsert
type ProductUpdate = PgUpdateSetSource<typeof productsTable>
type ProductPriceInsert = typeof productPricesTable.$inferInsert
type VariantInsert = typeof productVariantsTable.$inferInsert
type VariantPriceInsert = typeof productVariantPricesTable.$inferInsert

export interface IProductRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<ProductDto | undefined>
	findPage(filter: ProductFilterDto, db?: DbContext): Promise<WithPaginationResult<ProductDto>>
	checkScopedConflict(
		locationId: number,
		input: { sku: string; name: string },
		excludeId?: number,
		db?: DbContext,
	): Promise<{ sku: string; name: string } | undefined>
	insert(data: ProductInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertProductPrices(items: ProductPriceInsert[], db: DbContext): Promise<void>
	insertVariant(data: VariantInsert, db: DbContext): Promise<EntityRef | undefined>
	insertVariantPrices(items: VariantPriceInsert[], db: DbContext): Promise<void>
	deleteProductPrices(productId: number, db: DbContext): Promise<void>
	deleteVariants(productId: number, db: DbContext): Promise<void>
	updateProduct(id: number, data: ProductUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class ProductRepo implements IProductRepo {
	constructor(readonly db: DbContext) {}

	async #getProductPricesBatch(productIds: number[], db: DbContext) {
		if (productIds.length === 0) return new Map<number, ProductPriceDto[]>()

		const prices = await db
			.select()
			.from(productPricesTable)
			.where(inArray(productPricesTable.productId, productIds))

		const map = new Map<number, ProductPriceDto[]>()
		for (const id of productIds) map.set(id, [])
		for (const p of prices) {
			map.get(p.productId)!.push({ ...p, price: p.price })
		}
		return map
	}

	async #getVariantsBatch(productIds: number[], db: DbContext) {
		if (productIds.length === 0) return new Map<number, ProductVariantDto[]>()
		const variants = await db
			.select()
			.from(productVariantsTable)
			.where(inArray(productVariantsTable.productId, productIds))

		const variantIds = variants.map((v) => v.id)
		const prices =
			variantIds.length > 0
				? await db
						.select()
						.from(productVariantPricesTable)
						.where(inArray(productVariantPricesTable.variantId, variantIds))
				: []

		const pricesByVariant = new Map<number, VariantPriceDto[]>()
		for (const p of prices) {
			const list = pricesByVariant.get(p.variantId) ?? []
			list.push({ ...p, price: p.price })
			pricesByVariant.set(p.variantId, list)
		}

		const map = new Map<number, ProductVariantDto[]>()
		for (const id of productIds) map.set(id, [])
		for (const v of variants) {
			map.get(v.productId)!.push({
				...v,
				basePrice: v.basePrice,
				prices: (pricesByVariant.get(v.id) ?? []).map((p) => ({ ...p, price: p.price })),
			})
		}
		return map
	}

	#buildWhere(filter: Partial<Pick<ProductFilterDto, 'search' | 'status' | 'categoryId' | 'locationId'>>): SQL | undefined {
		const { search, status, categoryId, locationId } = filter
		return and(
			search
				? or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.sku, `%${search}%`))
				: undefined,
			status ? eq(productsTable.status, status) : undefined,
			categoryId ? eq(productsTable.categoryId, categoryId) : undefined,
			locationId ? eq(productsTable.locationId, locationId) : undefined,
		)
	}

	async findById(id: number, db: DbContext = this.db): Promise<ProductDto | undefined> {
		const product = await db
			.select()
			.from(productsTable)
			.where(eq(productsTable.id, id))
			.limit(1)
			.then(takeFirst)

		if (!product) return undefined

		const [variantsMap, pricesMap] = await Promise.all([
			this.#getVariantsBatch([id], db),
			this.#getProductPricesBatch([id], db),
		])

		return {
			...product,
			basePrice: product.basePrice,
			variants: variantsMap.get(id) ?? [],
			prices: pricesMap.get(id) ?? [],
			externalMappings: [],
		}
	}

	async findPage(filter: ProductFilterDto, db: DbContext = this.db): Promise<WithPaginationResult<ProductDto>> {
		const where = this.#buildWhere(filter)

		return paginate<ProductDto>({
			data: async ({ limit, offset }) => {
				const rows = await db
					.select()
					.from(productsTable)
					.where(where)
					.orderBy(sortBy(productsTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset)
				return rows.map((r) =>
					ProductDto.parse({
						...r,
						basePrice: r.basePrice,
						variants: [],
						prices: [],
						externalMappings: [],
					}),
				)
			},
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(productsTable).where(where),
		})
	}

	checkScopedConflict(
		locationId: number,
		input: { sku: string; name: string },
		excludeId?: number,
		db: DbContext = this.db,
	) {
		const conditions = [
			eq(productsTable.locationId, locationId),
			or(eq(productsTable.sku, input.sku), eq(productsTable.name, input.name)),
		]
		if (excludeId) conditions.push(not(eq(productsTable.id, excludeId)))

		return db
			.select({ sku: productsTable.sku, name: productsTable.name })
			.from(productsTable)
			.where(and(...conditions))
			.limit(1)
			.then(takeFirst)
	}

	async insert(data: ProductInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(productsTable)
			.values({ ...data })
			.returning({ id: productsTable.id })
		return result
	}

	async insertProductPrices(items: ProductPriceInsert[], db: DbContext): Promise<void> {
		if (items.length === 0) return
		await db.insert(productPricesTable).values(items)
	}

	async insertVariant(data: VariantInsert, db: DbContext): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(productVariantsTable)
			.values({ ...data })
			.returning({ id: productVariantsTable.id })
		return result
	}

	async insertVariantPrices(items: VariantPriceInsert[], db: DbContext): Promise<void> {
		if (items.length === 0) return
		await db.insert(productVariantPricesTable).values(items)
	}

	async deleteProductPrices(productId: number, db: DbContext): Promise<void> {
		await db.delete(productPricesTable).where(eq(productPricesTable.productId, productId))
	}

	async deleteVariants(productId: number, db: DbContext): Promise<void> {
		await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, productId))
	}

	async updateProduct(id: number, data: ProductUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(productsTable)
			.set({ ...data })
			.where(eq(productsTable.id, id))
			.returning({ id: productsTable.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(productsTable)
			.where(eq(productsTable.id, id))
			.returning({ id: productsTable.id })
		return result
	}
}
