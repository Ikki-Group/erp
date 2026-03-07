import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, inArray } from 'drizzle-orm'

import { cache } from '@/lib/cache'
import { paginate, sortBy, stampCreate, stampUpdate } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { recipeItems, recipes } from '@/db/schema'

import { db } from '@/db'

import type { RecipeDto, RecipeFilterDto, RecipeMutationDto, RecipeSelectDto } from '../dto/recipe.dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Recipe with ID ${id} not found`, 'RECIPE_NOT_FOUND'),
}

const cacheKey = {
  count: 'recipe.count',
  list: 'recipe.list',
  byId: (id: number) => `recipe.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RecipeService {
  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async getRecipeItems(recipeId: number) {
    return db.select().from(recipeItems).where(eq(recipeItems.recipeId, recipeId)).orderBy(recipeItems.sortOrder)
  }

  // ─── Public Reads ─────────────────────────────────────────────────────────

  async findById(id: number): Promise<RecipeDto> {
    return record('RecipeService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const [result] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1)
        if (!result) throw err.notFound(id)

        const items = await this.getRecipeItems(id)

        return { ...result, items }
      })
    })
  }

  async count(): Promise<number> {
    return record('RecipeService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(recipes)
        return result[0]?.val ?? 0
      })
    })
  }

  // ─── Public Handlers ──────────────────────────────────────────────────────

  async handleList(filter: RecipeFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<RecipeSelectDto>> {
    return record('RecipeService.handleList', async () => {
      const { materialId, productId, productVariantId, isActive } = filter

      const where = and(
        materialId === undefined ? undefined : eq(recipes.materialId, materialId),
        productId === undefined ? undefined : eq(recipes.productId, productId),
        productVariantId === undefined ? undefined : eq(recipes.productVariantId, productVariantId),
        isActive === undefined ? undefined : eq(recipes.isActive, isActive)
      )

      const result = await paginate({
        data: ({ limit, offset }) =>
          db.select().from(recipes).where(where).orderBy(sortBy(recipes.updatedAt, 'desc')).limit(limit).offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(recipes).where(where),
      })

      const recipeIds = result.data.map((r) => r.id)

      const allItems =
        recipeIds.length > 0
          ? await db
              .select()
              .from(recipeItems)
              .where(inArray(recipeItems.recipeId, recipeIds))
              .orderBy(recipeItems.sortOrder)
          : []

      const itemsByRecipe = new Map<number, typeof allItems>()
      for (const item of allItems) {
        const list = itemsByRecipe.get(item.recipeId) || []
        list.push(item)
        itemsByRecipe.set(item.recipeId, list)
      }

      const data: RecipeSelectDto[] = result.data.map((r) => ({
        ...r,
        items: itemsByRecipe.get(r.id) || [],
      }))

      return { data, meta: result.meta }
    })
  }

  async handleDetail(id: number): Promise<RecipeSelectDto> {
    return record('RecipeService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  private async checkTargetConflict(
    target: {
      materialId?: number | null | undefined
      productId?: number | null | undefined
      productVariantId?: number | null | undefined
    },
    excludeId?: number
  ) {
    const conditions = []

    if (target.materialId) conditions.push(eq(recipes.materialId, target.materialId))
    if (target.productId) conditions.push(eq(recipes.productId, target.productId))
    if (target.productVariantId) conditions.push(eq(recipes.productVariantId, target.productVariantId))

    if (conditions.length !== 1) {
      throw new ConflictError('Recipe must have exactly one target', 'RECIPE_MISSING_TARGET')
    }

    if (excludeId) {
      const { ne } = await import('drizzle-orm')
      conditions.push(ne(recipes.id, excludeId))
    }

    const [conflict] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(...conditions))
      .limit(1)

    if (conflict) {
      throw new ConflictError('A recipe already exists for this target', 'RECIPE_TARGET_ALREADY_EXISTS')
    }
  }

  async handleCreate(data: RecipeMutationDto, actorId: number): Promise<{ id: number }> {
    return record('RecipeService.handleCreate', async () => {
      await this.checkTargetConflict({
        materialId: data.materialId,
        productId: data.productId,
        productVariantId: data.productVariantId,
      })

      const meta = stampCreate(actorId)

      const inserted = await db.transaction(async (tx) => {
        const [recipe] = await tx
          .insert(recipes)
          .values({
            materialId: data.materialId ?? null,
            productId: data.productId ?? null,
            productVariantId: data.productVariantId ?? null,
            targetQty: data.targetQty,
            isActive: data.isActive,
            instructions: data.instructions,
            ...meta,
          })
          .returning({ id: recipes.id })

        if (!recipe) throw new Error('Failed to create recipe')

        if (data.items?.length) {
          await tx.insert(recipeItems).values(
            data.items.map((item) => ({
              recipeId: recipe.id,
              materialId: item.materialId,
              qty: item.qty,
              scrapPercentage: item.scrapPercentage,
              uomId: item.uomId,
              notes: item.notes,
              sortOrder: item.sortOrder,
              ...meta,
            }))
          )
        }

        return recipe
      })

      void this.clearCache()
      return inserted
    })
  }

  async handleUpdate(id: number, data: RecipeMutationDto, actorId: number): Promise<{ id: number }> {
    return record('RecipeService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const target = {
        materialId: data.materialId === undefined ? existing.materialId : data.materialId,
        productId: data.productId === undefined ? existing.productId : data.productId,
        productVariantId: data.productVariantId === undefined ? existing.productVariantId : data.productVariantId,
      }

      await this.checkTargetConflict(target, id)

      const updateMeta = stampUpdate(actorId)
      const createMeta = stampCreate(actorId)

      const updated = await db.transaction(async (tx) => {
        await tx
          .update(recipes)
          .set({
            materialId: data.materialId === undefined ? existing.materialId : data.materialId,
            productId: data.productId === undefined ? existing.productId : data.productId,
            productVariantId: data.productVariantId === undefined ? existing.productVariantId : data.productVariantId,
            targetQty: data.targetQty,
            isActive: data.isActive,
            instructions: data.instructions,
            ...updateMeta,
          })
          .where(eq(recipes.id, id))

        // Recreate items
        await tx.delete(recipeItems).where(eq(recipeItems.recipeId, id))

        if (data.items?.length) {
          await tx.insert(recipeItems).values(
            data.items.map((item) => ({
              recipeId: id,
              materialId: item.materialId,
              qty: item.qty,
              scrapPercentage: item.scrapPercentage,
              uomId: item.uomId,
              notes: item.notes ?? null,
              sortOrder: item.sortOrder,
              ...createMeta,
            }))
          )
        }

        return { id }
      })

      void this.clearCache(id)
      return updated
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record('RecipeService.handleRemove', async () => {
      const result = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id })
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
