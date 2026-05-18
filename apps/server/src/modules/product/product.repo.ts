import { and, count, eq, ilike, inArray, not, or } from 'drizzle-orm'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import {
	productPricesTable,
	productsTable,
	productVariantsTable,
	variantPricesTable,
} from '@/db/schema'

import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/types/utils'

import {
	ProductSchema,
	type ProductFilterSchema,
	type ProductMutationSchema,
	ProductPriceSchema,
	ProductVariantSchema,
	VariantPriceSchema,
} from './product.schema'

const DEFAULT_VARIANT_NAME = 'Default'

export class ProductRepo {
	constructor(private readonly db: DbClient) {}

	async #getProductPricesBatch(productIds: number[]) {
		if (productIds.length === 0) return new Map<number, ProductPriceSchema[]>()

		const prices = await this.db
			.select()
			.from(productPricesTable)
			.where(inArray(productPricesTable.productId, productIds))

		const map = new Map<number, ProductPriceSchema[]>()
		for (const id of productIds) map.set(id, [])
		for (const p of prices) {
			map.get(p.productId)!.push({ ...p, price: p.price })
		}
		return map
	}

	async #getVariantsBatch(productIds: number[]) {
		if (productIds.length === 0) return new Map<number, ProductVariantSchema[]>()
		const variants = await this.db
			.select()
			.from(productVariantsTable)
			.where(inArray(productVariantsTable.productId, productIds))

		const variantIds = variants.map((v) => v.id)
		const prices =
			variantIds.length > 0
				? await this.db
						.select()
						.from(variantPricesTable)
						.where(inArray(variantPricesTable.variantId, variantIds))
				: []

		const pricesByVariant = new Map<number, VariantPriceSchema[]>()
		for (const p of prices) {
			const list = pricesByVariant.get(p.variantId) ?? []
			list.push({ ...p, price: p.price })
			pricesByVariant.set(p.variantId, list)
		}

		const map = new Map<number, ProductVariantSchema[]>()
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

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<ProductSchema | undefined> {
		const [product] = await this.db
			.select()
			.from(productsTable)
			.where(eq(productsTable.id, id))
			.limit(1)

		if (!product) return undefined

		const [variantsMap, pricesMap] = await Promise.all([
			this.#getVariantsBatch([id]),
			this.#getProductPricesBatch([id]),
		])

		return {
			...product,
			basePrice: product.basePrice,
			variants: variantsMap.get(id) ?? [],
			prices: pricesMap.get(id) ?? [],
			externalMappings: [],
		}
	}

	async getListPaginated(
		filter: ProductFilterSchema,
	): Promise<WithPaginationResult<ProductSchema>> {
		const { search, status, categoryId, locationId, page, limit } = filter

		const conditions = [
			search
				? or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.sku, `%${search}%`))
				: undefined,
			status ? eq(productsTable.status, status) : undefined,
			categoryId ? eq(productsTable.categoryId, categoryId) : undefined,
			locationId ? eq(productsTable.locationId, locationId) : undefined,
		].filter((c): c is NonNullable<typeof c> => c !== undefined)

		const where = conditions.length > 0 ? and(...conditions) : undefined

		const result = await paginate({
			data: async ({ limit: l, offset }) => {
				const rows = await this.db
					.select()
					.from(productsTable)
					.where(where)
					.orderBy(sortBy(productsTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset)
				return rows.map((r) =>
					ProductSchema.parse({
						...r,
						basePrice: r.basePrice,
						variants: [],
						prices: [],
						externalMappings: [],
					}),
				)
			},
			pq: { page, limit },
			countQuery: this.db.select({ count: count() }).from(productsTable).where(where),
		})

		return result
	}

	async checkScopedConflict(
		locationId: number,
		input: { sku: string; name: string },
		excludeId?: number,
	) {
		const conditions = [
			eq(productsTable.locationId, locationId),
			or(eq(productsTable.sku, input.sku), eq(productsTable.name, input.name)),
		]
		if (excludeId) conditions.push(not(eq(productsTable.id, excludeId)))

		const [conflict] = await this.db
			.select({ sku: productsTable.sku, name: productsTable.name })
			.from(productsTable)
			.where(and(...conditions))
			.limit(1)

		if (conflict) {
			if (conflict.sku === input.sku)
				throw new ConflictError(
					'Product SKU already exists in this location',
					'PRODUCT_SKU_ALREADY_EXISTS',
				)
			if (conflict.name === input.name)
				throw new ConflictError(
					'Product name already exists in this location',
					'PRODUCT_NAME_ALREADY_EXISTS',
				)
		}
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: ProductMutationSchema, actorId: ActorId): Promise<EntityRef> {
		const meta = stampCreate(actorId)
		return this.db.transaction(async (tx) => {
			const [product] = await tx
				.insert(productsTable)
				.values({
					name: data.name,
					description: data.description,
					sku: data.sku,
					locationId: data.locationId,
					categoryId: data.categoryId,
					status: data.status,
					basePrice: (data.basePrice ?? 0).toString(),
					hasVariants: data.hasVariants,
					hasSalesTypePricing: data.hasSalesTypePricing,
					...meta,
				})
				.returning({ id: productsTable.id })

			if (!product) throw new Error('Create product failed')

			if (!data.hasVariants && data.hasSalesTypePricing && data.prices?.length) {
				await tx.insert(productPricesTable).values(
					data.prices.map((p) => ({
						productId: product.id,
						salesTypeId: p.salesTypeId,
						price: p.price.toString(),
						...meta,
					})),
				)
			}

			const inputVariants = data.hasVariants
				? data.variants && data.variants.length > 0
					? data.variants
					: [
							{
								name: DEFAULT_VARIANT_NAME,
								isDefault: true,
								prices: [],
								basePrice: '0',
								sku: data.sku,
							},
						]
				: []

			for (const variant of inputVariants) {
				const [insertedV] = await tx
					.insert(productVariantsTable)
					.values({
						productId: product.id,
						name: variant.name.trim(),
						sku: variant.sku?.trim() ?? '',
						isDefault: variant.isDefault ?? false,
						basePrice: (variant.basePrice ?? 0).toString(),
						...meta,
					})
					.returning({ id: productVariantsTable.id })

				if (insertedV && data.hasSalesTypePricing && variant.prices?.length) {
					await tx.insert(variantPricesTable).values(
						variant.prices.map((p) => ({
							variantId: insertedV.id,
							salesTypeId: p.salesTypeId,
							price: p.price.toString(),
							...meta,
						})),
					)
				}
			}
			return { id: product.id }
		})
	}

	async update(id: number, data: ProductMutationSchema, actorId: ActorId): Promise<EntityRef> {
		const updateMeta = stampUpdate(actorId)
		const createMeta = stampCreate(actorId)

		await this.db.transaction(async (tx) => {
			await tx
				.update(productsTable)
				.set({
					name: data.name,
					description: data.description,
					sku: data.sku,
					locationId: data.locationId,
					categoryId: data.categoryId,
					status: data.status,
					basePrice: (data.basePrice ?? 0).toString(),
					hasVariants: data.hasVariants,
					hasSalesTypePricing: data.hasSalesTypePricing,
					...updateMeta,
				})
				.where(eq(productsTable.id, id))

			await tx.delete(productPricesTable).where(eq(productPricesTable.productId, id))
			if (!data.hasVariants && data.hasSalesTypePricing && data.prices?.length) {
				await tx.insert(productPricesTable).values(
					data.prices.map((p) => ({
						productId: id,
						salesTypeId: p.salesTypeId,
						price: p.price.toString(),
						...createMeta,
					})),
				)
			}

			if (data.hasVariants && data.variants) {
				await tx.delete(productVariantsTable).where(eq(productVariantsTable.productId, id))
				for (const variant of data.variants) {
					const [insertedV] = await tx
						.insert(productVariantsTable)
						.values({
							productId: id,
							name: variant.name.trim(),
							sku: variant.sku?.trim() ?? '',
							isDefault: variant.isDefault ?? false,
							basePrice: (variant.basePrice ?? 0).toString(),
							...createMeta,
						})
						.returning({ id: productVariantsTable.id })

					if (insertedV && data.hasSalesTypePricing && variant.prices?.length) {
						await tx.insert(variantPricesTable).values(
							variant.prices.map((p) => ({
								variantId: insertedV.id,
								salesTypeId: p.salesTypeId,
								price: p.price.toString(),
								...createMeta,
							})),
						)
					}
				}
			} else if (!data.hasVariants) {
				await tx.delete(productVariantsTable).where(eq(productVariantsTable.productId, id))
			}
		})
		return { id }
	}

	async softDelete(id: number): Promise<EntityRef> {
		const [result] = await this.db
			.delete(productsTable)
			.where(eq(productsTable.id, id))
			.returning({ id: productsTable.id })
		if (!result) throw new NotFoundError(`Product with ID ${id} not found`, 'PRODUCT_NOT_FOUND')
		return { id: result.id }
	}

	async hardDelete(id: number): Promise<EntityRef> {
		const [result] = await this.db
			.delete(productsTable)
			.where(eq(productsTable.id, id))
			.returning({ id: productsTable.id })
		if (!result) throw new NotFoundError(`Product with ID ${id} not found`, 'PRODUCT_NOT_FOUND')
		return { id: result.id }
	}
}
