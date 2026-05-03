import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, exists, inArray, isNull, not, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'

import {
	productExternalMappingsTable,
	productPricesTable,
	productsTable,
	productVariantsTable,
	variantPricesTable,
} from '@/db/schema'

import {
	ProductDto,
	ProductExternalMappingDto,
	ProductFilterDto,
	ProductMutationDto,
	ProductPriceDto,
	ProductVariantDto,
	VariantPriceDto,
} from './product.dto'

const DEFAULT_VARIANT_NAME = 'Default'

export class ProductRepo {
	constructor(private readonly db: DbClient) {}

	async #getProductPricesBatch(productIds: number[]) {
		if (productIds.length === 0) return new Map<number, ProductPriceDto[]>()

		const prices = await this.db
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

	async #getVariantsBatch(productIds: number[]) {
		if (productIds.length === 0) return new Map<number, ProductVariantDto[]>()
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

	async #getProductExternalMappingsBatch(
		productIds: number[],
	): Promise<Map<number, ProductExternalMappingDto[]>> {
		if (productIds.length === 0) return new Map()
		const mappings = await this.db
			.select()
			.from(productExternalMappingsTable)
			.where(inArray(productExternalMappingsTable.productId, productIds))

		const map = new Map<number, ProductExternalMappingDto[]>()
		for (const id of productIds) map.set(id, [])
		for (const m of mappings) map.get(m.productId)!.push(m)
		return map
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<ProductDto | undefined> {
		return record('ProductRepo.getById', async () => {
			const [product] = await this.db
				.select()
				.from(productsTable)
				.where(and(eq(productsTable.id, id), isNull(productsTable.deletedAt)))
				.limit(1)

			if (!product) return undefined

			const [variantsMap, pricesMap, mappingsMap] = await Promise.all([
				this.#getVariantsBatch([id]),
				this.#getProductPricesBatch([id]),
				this.#getProductExternalMappingsBatch([id]),
			])

			return {
				...product,
				basePrice: product.basePrice,
				variants: variantsMap.get(id) ?? [],
				prices: pricesMap.get(id) ?? [],
				externalMappings: mappingsMap.get(id) ?? [],
			}
		})
	}

	async getListPaginated(filter: ProductFilterDto): Promise<WithPaginationResult<ProductDto>> {
		return record('ProductRepo.getListPaginated', async () => {
			const { search, status, categoryId, locationId, isExternal, provider, page, limit } = filter

			const externalCondition =
				isExternal !== undefined || provider !== undefined
					? exists(
							this.db
								.select({ id: productExternalMappingsTable.id })
								.from(productExternalMappingsTable)
								.where(
									and(
										eq(productExternalMappingsTable.provider, provider ?? 'moka'),
										eq(productExternalMappingsTable.productId, productsTable.id),
									),
								),
						)
					: undefined

			const where = and(
				isNull(productsTable.deletedAt),
				search
					? or(searchFilter(productsTable.name, search), searchFilter(productsTable.sku, search))
					: undefined,
				status ? eq(productsTable.status, status) : undefined,
				categoryId === undefined ? undefined : eq(productsTable.categoryId, categoryId),
				locationId === undefined ? undefined : eq(productsTable.locationId, locationId),
				externalCondition
					? isExternal === false
						? not(externalCondition)
						: externalCondition
					: undefined,
			)

			const result = await paginate({
				data: ({ limit: l, offset }) =>
					this.db
						.select()
						.from(productsTable)
						.where(where)
						.orderBy(sortBy(productsTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(productsTable).where(where),
			})

			const productIds = result.data.map((p) => p.id)
			const [variantsMap, pricesMap, mappingsMap] = await Promise.all([
				this.#getVariantsBatch(productIds),
				this.#getProductPricesBatch(productIds),
				this.#getProductExternalMappingsBatch(productIds),
			])

			return {
				data: result.data.map((p) =>
					ProductDto.parse({
						...p,
						basePrice: p.basePrice,
						variants: variantsMap.get(p.id) ?? [],
						prices: pricesMap.get(p.id) ?? [],
						externalMappings: mappingsMap.get(p.id) ?? [],
					}),
				),
				meta: result.meta,
			}
		})
	}

	async checkScopedConflict(
		locationId: number,
		input: { sku: string; name: string },
		excludeId?: number,
	) {
		const conditions = [
			eq(productsTable.locationId, locationId),
			isNull(productsTable.deletedAt),
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

	async create(data: ProductMutationDto, actorId: number): Promise<{ id: number }> {
		return record('ProductRepo.create', async () => {
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
							sku: variant.sku?.trim() ?? null,
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
				return product
			})
		})
	}

	async update(id: number, data: ProductMutationDto, actorId: number): Promise<{ id: number }> {
		return record('ProductRepo.update', async () => {
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
								sku: variant.sku?.trim() ?? null,
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
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductRepo.softDelete', async () => {
			const [result] = await this.db
				.update(productsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(productsTable.id, id))
				.returning({ id: productsTable.id })
			if (!result) throw new NotFoundError(`Product with ID ${id} not found`, 'PRODUCT_NOT_FOUND')
			return result
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('ProductRepo.hardDelete', async () => {
			const [result] = await this.db
				.delete(productsTable)
				.where(eq(productsTable.id, id))
				.returning({ id: productsTable.id })
			if (!result) throw new NotFoundError(`Product with ID ${id} not found`, 'PRODUCT_NOT_FOUND')
			return result
		})
	}
}
