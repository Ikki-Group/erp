import { record } from '@elysiajs/opentelemetry'
import { inArray } from 'drizzle-orm'

import { productCategoriesTable } from '@/db/schema'
import { CacheService, type CacheClient } from '@/infra/cache'
import { withTransaction, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { ProductCategoryDto } from './category/category.contract'
import type { IProductCategoryRepo } from './category/category.repo'
import type {
	ProductDto,
	ProductFilterDto,
	ProductMutationDto,
	ProductSelectDto,
} from './product.contract'
import { ProductError } from './product.internal'
import type { IProductRepo } from './product.repo'

const DEFAULT_VARIANT_NAME = 'Default'

type CategoryReadPort = Pick<IProductCategoryRepo, 'findById' | 'db'>

export class ProductService {
	private readonly cache: CacheService

	constructor(
		private readonly categoryRepo: CategoryReadPort,
		private readonly repo: IProductRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'product')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	private validateDefaultVariant(variants: { isDefault?: boolean; name: string }[]) {
		const defaults = variants.filter((v) => v.isDefault)
		if (defaults.length > 1) {
			throw ProductError.multipleDefaultVariants()
		}
	}

	private async checkConflict(
		locationId: number,
		input: { sku: string; name: string },
		excludeId?: number,
		db: DbContext = this.repo.db,
	) {
		const conflict = await this.repo.checkScopedConflict(locationId, input, excludeId, db)
		if (conflict) {
			if (conflict.sku === input.sku) throw ProductError.skuConflict()
			if (conflict.name === input.name) throw ProductError.nameConflict()
		}
	}

	async getById(id: number): Promise<ProductDto | undefined> {
		return record('ProductService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async handleList(filter: ProductFilterDto): Promise<WithPaginationResult<ProductSelectDto>> {
		return record('ProductService.handleList', async () => {
			const result = await this.repo.findPage(filter)

			const categoryIds = result.data
				.map((p) => p.categoryId)
				.filter((id): id is number => id !== null)

			const uniqueCategoryIds = [...new Set(categoryIds)]

			const categories: ProductCategoryDto[] = uniqueCategoryIds.length > 0
				? await this.categoryRepo.db
						.select()
						.from(productCategoriesTable)
						.where(inArray(productCategoriesTable.id, uniqueCategoryIds))
				: []

			const categoriesMap = new Map<number, ProductCategoryDto>(categories.map((c) => [c.id, c]))

			const data: ProductSelectDto[] = result.data.map((p) => ({
				...p,
				category: p.categoryId ? (categoriesMap.get(p.categoryId) ?? null) : null,
			}))

			return { data, meta: result.meta }
		})
	}

	async handleDetail(id: number): Promise<ProductSelectDto> {
		return record('ProductService.handleDetail', async () => {
			const product = await this.getById(id)
			if (!product) throw ProductError.notFound(id)

			const category = product.categoryId
				? ((await this.categoryRepo.findById(product.categoryId)) ?? null)
				: null
			return { ...product, category }
		})
	}

	async handleCreate(data: ProductMutationDto, actorId: ActorId): Promise<EntityRef> {
		return record('ProductService.handleCreate', async () => {
			const sku = data.sku.trim()
			const name = data.name.trim()

			await this.checkConflict(data.locationId, { sku, name })

			if (data.hasVariants && data.variants) {
				this.validateDefaultVariant(data.variants)
			}

			const createMeta = stampCreate(actorId)

			const result = await withTransaction(this.repo.db, async (tx) => {
				const product = await this.repo.insert(
					{
						name: data.name,
						description: data.description,
						sku: data.sku,
						locationId: data.locationId,
						categoryId: data.categoryId,
						status: data.status,
						basePrice: (data.basePrice ?? 0).toString(),
						hasVariants: data.hasVariants,
						hasSalesTypePricing: data.hasSalesTypePricing,
						...createMeta,
					},
					tx,
				)
				if (!product) throw ProductError.createFailed()

				if (!data.hasVariants && data.hasSalesTypePricing && data.prices?.length) {
					await this.repo.insertProductPrices(
						data.prices.map((p) => ({
							productId: product.id,
							salesTypeId: p.salesTypeId,
							price: p.price.toString(),
							...createMeta,
						})),
						tx,
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
					const insertedV = await this.repo.insertVariant(
						{
							productId: product.id,
							name: variant.name.trim(),
							sku: variant.sku?.trim() ?? '',
							isDefault: variant.isDefault ?? false,
							basePrice: (variant.basePrice ?? 0).toString(),
							...createMeta,
						},
						tx,
					)

					if (insertedV && data.hasSalesTypePricing && variant.prices?.length) {
						await this.repo.insertVariantPrices(
							variant.prices.map((p) => ({
								variantId: insertedV.id,
								salesTypeId: p.salesTypeId,
								price: p.price.toString(),
								...createMeta,
							})),
							tx,
						)
					}
				}

				return product
			})

			await this.invalidate()
			return result
		})
	}

	async handleUpdate(id: number, data: ProductMutationDto, actorId: ActorId): Promise<EntityRef> {
		return record('ProductService.handleUpdate', async () => {
			const existing = await this.getById(id)
			if (!existing) throw ProductError.notFound(id)

			const sku = data.sku ? data.sku.trim() : existing.sku
			const name = data.name ? data.name.trim() : existing.name

			await this.checkConflict(data.locationId ?? existing.locationId, { sku, name }, id)

			if (data.hasVariants && data.variants) {
				this.validateDefaultVariant(data.variants)
			}

			const updateMeta = stampUpdate(actorId)
			const createMeta = stampCreate(actorId)

			await withTransaction(this.repo.db, async (tx) => {
				const updated = await this.repo.updateProduct(
					id,
					{
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
					},
					tx,
				)
				if (!updated) throw ProductError.updateFailed(id)

				await this.repo.deleteProductPrices(id, tx)
				if (!data.hasVariants && data.hasSalesTypePricing && data.prices?.length) {
					await this.repo.insertProductPrices(
						data.prices.map((p) => ({
							productId: id,
							salesTypeId: p.salesTypeId,
							price: p.price.toString(),
							...createMeta,
						})),
						tx,
					)
				}

				if (data.hasVariants && data.variants) {
					await this.repo.deleteVariants(id, tx)
					for (const variant of data.variants) {
						const insertedV = await this.repo.insertVariant(
							{
								productId: id,
								name: variant.name.trim(),
								sku: variant.sku?.trim() ?? '',
								isDefault: variant.isDefault ?? false,
								basePrice: (variant.basePrice ?? 0).toString(),
								...createMeta,
							},
							tx,
						)

						if (insertedV && data.hasSalesTypePricing && variant.prices?.length) {
							await this.repo.insertVariantPrices(
								variant.prices.map((p) => ({
									variantId: insertedV.id,
									salesTypeId: p.salesTypeId,
									price: p.price.toString(),
									...createMeta,
								})),
								tx,
							)
						}
					}
				} else if (!data.hasVariants) {
					await this.repo.deleteVariants(id, tx)
				}
			})

			await this.invalidate(id)
			return { id }
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('ProductService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw ProductError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleHardRemove(id: number): Promise<EntityRef> {
		return record('ProductService.handleHardRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw ProductError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}
}
