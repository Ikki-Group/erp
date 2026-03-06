import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, inArray, or } from 'drizzle-orm'

import { cache } from '@/lib/cache'
import { paginate, sortBy, stampCreate, stampUpdate } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { db } from '@/db'
import { productPrices, products, productVariants, variantPrices } from '@/db/schema'

import type {
  ProductCategoryDto,
  ProductDto,
  ProductFilterDto,
  ProductMutationDto,
  ProductPriceDto,
  ProductSelectDto,
  ProductVariantDto,
  VariantPriceDto,
} from '../dto'

import type { ProductCategoryService } from './product-category.service'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Product with ID ${id} not found`, 'PRODUCT_NOT_FOUND'),
}

const DEFAULT_VARIANT_NAME = 'Default'

const cacheKey = {
  count: 'product.count',
  list: 'product.list',
  byId: (id: number) => `product.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class ProductService {
  constructor(private readonly categorySvc: ProductCategoryService) {}

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Fetches product-level prices (for non-variant products with sales type pricing).
   */
  private async getProductPrices(productId: number): Promise<ProductPriceDto[]> {
    return db.select().from(productPrices).where(eq(productPrices.productId, productId))
  }

  /**
   * Batch-fetches product-level prices for multiple products.
   */
  private async getProductPricesBatch(productIds: number[]) {
    if (productIds.length === 0) return new Map<number, ProductPriceDto[]>()

    const prices = await db.select().from(productPrices).where(inArray(productPrices.productId, productIds))

    const map = new Map<number, ProductPriceDto[]>()
    for (const id of productIds) map.set(id, [])
    for (const p of prices) map.get(p.productId)!.push(p)

    return map
  }

  /**
   * Fetches variants + prices for a single product.
   */
  private async getVariantsWithPrices(productId: number): Promise<ProductVariantDto[]> {
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId))

    if (variants.length === 0) return []

    const variantIds = variants.map((v) => v.id)
    const prices = await db.select().from(variantPrices).where(inArray(variantPrices.variantId, variantIds))

    const pricesByVariant = new Map<number, VariantPriceDto[]>()
    for (const p of prices) {
      const list = pricesByVariant.get(p.variantId) ?? []
      list.push(p)
      pricesByVariant.set(p.variantId, list)
    }

    return variants.map((v) => ({
      ...v,
      prices: pricesByVariant.get(v.id) ?? [],
    }))
  }

  /**
   * Batch-fetches variants + prices for multiple products.
   */
  private async getVariantsBatch(productIds: number[]) {
    if (productIds.length === 0) return new Map<number, ProductVariantDto[]>()

    const variants = await db.select().from(productVariants).where(inArray(productVariants.productId, productIds))

    const variantIds = variants.map((v) => v.id)

    const prices =
      variantIds.length > 0
        ? await db.select().from(variantPrices).where(inArray(variantPrices.variantId, variantIds))
        : []

    const pricesByVariant = new Map<number, VariantPriceDto[]>()
    for (const p of prices) {
      const list = pricesByVariant.get(p.variantId) ?? []
      list.push(p)
      pricesByVariant.set(p.variantId, list)
    }

    const map = new Map<number, ProductVariantDto[]>()
    for (const id of productIds) {
      map.set(id, [])
    }
    for (const v of variants) {
      map.get(v.productId)!.push({
        ...v,
        prices: pricesByVariant.get(v.id) ?? [],
      })
    }

    return map
  }

  /**
   * Checks uniqueness of SKU and name scoped to a location.
   */
  private async checkScopedConflict(locationId: number, input: { sku: string; name: string }, excludeId?: number) {
    const conditions = [
      eq(products.locationId, locationId),
      or(eq(products.sku, input.sku), eq(products.name, input.name)),
    ]

    if (excludeId) {
      const { ne } = await import('drizzle-orm')
      conditions.push(ne(products.id, excludeId))
    }

    const [conflict] = await db
      .select({ sku: products.sku, name: products.name })
      .from(products)
      .where(and(...conditions))
      .limit(1)

    if (!conflict) return

    if (conflict.sku === input.sku) {
      throw new ConflictError('Product SKU already exists in this location', 'PRODUCT_SKU_ALREADY_EXISTS')
    }
    if (conflict.name === input.name) {
      throw new ConflictError('Product name already exists in this location', 'PRODUCT_NAME_ALREADY_EXISTS')
    }
  }

  /**
   * Validates that at most one variant has isDefault = true.
   */
  private validateDefaultVariant(variants: { isDefault?: boolean; name: string }[]) {
    const defaults = variants.filter((v) => v.isDefault)
    if (defaults.length > 1) {
      throw new ConflictError('Only one variant can be set as default', 'MULTIPLE_DEFAULT_VARIANTS')
    }
  }

  // ─── Public Reads ─────────────────────────────────────────────────────────

  async findById(id: number): Promise<ProductDto> {
    return record('ProductService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const [result] = await db.select().from(products).where(eq(products.id, id)).limit(1)
        if (!result) throw err.notFound(id)

        const variants = result.hasVariants ? await this.getVariantsWithPrices(id) : []
        const prices = !result.hasVariants && result.hasSalesTypePricing ? await this.getProductPrices(id) : []

        return { ...result, variants, prices }
      })
    })
  }

  async count(): Promise<number> {
    return record('ProductService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(products)
        return result[0]?.val ?? 0
      })
    })
  }

  // ─── Public Handlers ──────────────────────────────────────────────────────

  async handleList(filter: ProductFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<ProductSelectDto>> {
    return record('ProductService.handleList', async () => {
      const { search, status, categoryId, locationId } = filter

      const searchCondition = search
        ? or(ilike(products.name, `%${search}%`), ilike(products.sku, `%${search}%`))
        : undefined

      const where = and(
        searchCondition,
        status ? eq(products.status, status) : undefined,
        categoryId === undefined ? undefined : eq(products.categoryId, categoryId),
        locationId === undefined ? undefined : eq(products.locationId, locationId)
      )

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(products)
            .where(where)
            .orderBy(sortBy(products.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(products).where(where),
      })

      const productIds = result.data.map((p) => p.id)
      const variantsMap = await this.getVariantsBatch(productIds)
      const pricesMap = await this.getProductPricesBatch(productIds)

      const categoriesMap = new Map<number, ProductCategoryDto>()
      const allCategories = await this.categorySvc.find()
      for (const cat of allCategories) {
        categoriesMap.set(cat.id, cat)
      }

      const data: ProductSelectDto[] = result.data.map((p) => ({
        ...p,
        variants: variantsMap.get(p.id) ?? [],
        prices: pricesMap.get(p.id) ?? [],
        category: p.categoryId ? (categoriesMap.get(p.categoryId) ?? null) : null,
      }))

      return { data, meta: result.meta }
    })
  }

  async handleDetail(id: number): Promise<ProductSelectDto> {
    return record('ProductService.handleDetail', async () => {
      const product = await this.findById(id)
      const category = product.categoryId ? await this.categorySvc.findById(product.categoryId) : null
      return { ...product, category }
    })
  }

  async handleCreate(data: ProductMutationDto, actorId: number): Promise<{ id: number }> {
    return record('ProductService.handleCreate', async () => {
      const sku = data.sku.trim()
      const name = data.name.trim()

      await this.checkScopedConflict(data.locationId, { sku, name })

      // Prepare variants (only when hasVariants = true)
      const inputVariants = data.hasVariants
        ? data.variants?.length
          ? data.variants
          : [{ name: DEFAULT_VARIANT_NAME, isDefault: true, prices: [], basePrice: '0' }]
        : []

      if (inputVariants.length > 0) {
        this.validateDefaultVariant(inputVariants)
      }

      const meta = stampCreate(actorId)

      const inserted = await db.transaction(async (tx) => {
        const [product] = await tx
          .insert(products)
          .values({
            name,
            description: data.description,
            sku,
            locationId: data.locationId,
            categoryId: data.categoryId,
            status: data.status,
            basePrice: data.basePrice,
            hasVariants: data.hasVariants,
            hasSalesTypePricing: data.hasSalesTypePricing,
            ...meta,
          })
          .returning({ id: products.id })

        if (!product) throw new Error('Failed to create product')

        // Insert product-level prices (when !hasVariants && hasSalesTypePricing)
        if (!data.hasVariants && data.hasSalesTypePricing && data.prices?.length) {
          await tx.insert(productPrices).values(
            data.prices.map((p) => ({
              productId: product.id,
              salesTypeId: p.salesTypeId,
              price: p.price,
              ...meta,
            }))
          )
        }

        // Insert variants + variant prices (when hasVariants)
        for (const variant of inputVariants) {
          const [insertedVariant] = await tx
            .insert(productVariants)
            .values({
              productId: product.id,
              name: variant.name.trim(),
              sku: variant.sku?.trim() || null,
              isDefault: variant.isDefault ?? false,
              basePrice: variant.basePrice ?? '0',
              ...meta,
            })
            .returning({ id: productVariants.id })

          if (insertedVariant && data.hasSalesTypePricing && variant.prices.length > 0) {
            await tx.insert(variantPrices).values(
              variant.prices.map((p) => ({
                variantId: insertedVariant.id,
                salesTypeId: p.salesTypeId,
                price: p.price,
                ...meta,
              }))
            )
          }
        }

        return product
      })

      void this.clearCache()
      return inserted
    })
  }

  async handleUpdate(id: number, data: ProductMutationDto, actorId: number): Promise<{ id: number }> {
    return record('ProductService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const sku = data.sku ? data.sku.trim() : existing.sku
      const name = data.name ? data.name.trim() : existing.name

      await this.checkScopedConflict(data.locationId ?? existing.locationId, { sku, name }, existing.id)

      if (data.variants) {
        this.validateDefaultVariant(data.variants)
      }

      const updateMeta = stampUpdate(actorId)
      const createMeta = stampCreate(actorId)

      await db.transaction(async (tx) => {
        await tx
          .update(products)
          .set({
            name,
            description: data.description,
            sku,
            locationId: data.locationId,
            categoryId: data.categoryId,
            status: data.status,
            basePrice: data.basePrice,
            hasVariants: data.hasVariants,
            hasSalesTypePricing: data.hasSalesTypePricing,
            ...updateMeta,
          })
          .where(eq(products.id, id))

        // Replace product-level prices
        await tx.delete(productPrices).where(eq(productPrices.productId, id))

        if (!data.hasVariants && data.hasSalesTypePricing && data.prices?.length) {
          await tx.insert(productPrices).values(
            data.prices.map((p) => ({
              productId: id,
              salesTypeId: p.salesTypeId,
              price: p.price,
              ...createMeta,
            }))
          )
        }

        // Replace variants if provided (delete-and-recreate strategy)
        if (data.hasVariants && data.variants) {
          // Delete existing variants (cascade deletes variant_prices)
          await tx.delete(productVariants).where(eq(productVariants.productId, id))

          for (const variant of data.variants) {
            const [insertedVariant] = await tx
              .insert(productVariants)
              .values({
                productId: id,
                name: variant.name.trim(),
                sku: variant.sku?.trim() || null,
                isDefault: variant.isDefault ?? false,
                basePrice: variant.basePrice ?? '0',
                ...createMeta,
              })
              .returning({ id: productVariants.id })

            if (insertedVariant && data.hasSalesTypePricing && variant.prices.length > 0) {
              await tx.insert(variantPrices).values(
                variant.prices.map((p) => ({
                  variantId: insertedVariant.id,
                  salesTypeId: p.salesTypeId,
                  price: p.price,
                  ...createMeta,
                }))
              )
            }
          }
        } else if (!data.hasVariants) {
          // If switching from variants → no variants, clean up existing variants
          await tx.delete(productVariants).where(eq(productVariants.productId, id))
        }
      })

      void this.clearCache(id)
      return { id }
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record('ProductService.handleRemove', async () => {
      const result = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id })
      if (result.length === 0) throw err.notFound(id)

      void this.clearCache(id)
      return { id }
    })
  }

  // ─── Cache ────────────────────────────────────────────────────────────────

  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}
