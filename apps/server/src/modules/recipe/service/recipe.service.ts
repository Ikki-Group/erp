import { record } from '@elysiajs/opentelemetry'
import { eq } from 'drizzle-orm'

import { stampCreate } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'

import { db } from '@/db'
import { materials, recipeItems, recipes } from '@/db/schema'

import type { RecipeDetailDto, RecipeUpsertDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Recipe with ID ${id} not found`, 'RECIPE_NOT_FOUND'),
  notFoundByTarget: () => new NotFoundError('Recipe for the requested target not found', 'RECIPE_NOT_FOUND'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RecipeService {
  // ─── Public Reads ─────────────────────────────────────────────────────────

  async getRecipeByTarget(target: { materialId?: number; productVariantId?: number }): Promise<RecipeDetailDto> {
    return record('RecipeService.getRecipeByTarget', async () => {
      let condition
      if (target.materialId) {
        condition = eq(recipes.materialId, target.materialId)
      } else if (target.productVariantId) {
        condition = eq(recipes.productVariantId, target.productVariantId)
      } else {
        throw new Error('Must provide either materialId or productVariantId')
      }

      const [recipe] = await db.select().from(recipes).where(condition).limit(1)

      if (!recipe) throw err.notFoundByTarget()

      return this.handleDetail(recipe.id)
    })
  }

  async handleDetail(id: number): Promise<RecipeDetailDto> {
    return record('RecipeService.handleDetail', async () => {
      const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1)

      if (!recipe) throw err.notFound(id)

      const items = await db
        .select({
          item: recipeItems,
          materialName: materials.name,
          materialSku: materials.sku,
          materialBaseUom: materials.baseUom,
        })
        .from(recipeItems)
        .innerJoin(materials, eq(recipeItems.materialId, materials.id))
        .where(eq(recipeItems.recipeId, id))

      return {
        ...recipe,
        items: items.map((i) => ({
          ...i.item,
          materialName: i.materialName,
          materialSku: i.materialSku,
          materialBaseUom: i.materialBaseUom,
        })),
      }
    })
  }

  // ─── Public Handlers ──────────────────────────────────────────────────────

  async handleUpsert(data: RecipeUpsertDto, actorId: number): Promise<{ id: number }> {
    return record('RecipeService.handleUpsert', async () => {
      return await db.transaction(async (tx) => {
        let condition
        if (data.materialId) {
          condition = eq(recipes.materialId, data.materialId)
        } else if (data.productVariantId) {
          condition = eq(recipes.productVariantId, data.productVariantId)
        } else {
          throw new ConflictError('Must provide either materialId or productVariantId', 'INVALID_RECIPE_TARGET')
        }

        const [existing] = await tx.select().from(recipes).where(condition).limit(1)

        const metadata = stampCreate(actorId)
        let recipeId: number

        if (existing) {
          // Update
          const [updated] = await tx
            .update(recipes)
            .set({
              targetQty: data.targetQty,
              instructions: data.instructions,
            })
            .where(eq(recipes.id, existing.id))
            .returning({ id: recipes.id })

          recipeId = updated!.id

          // Delete all old items to completely replace them
          await tx.delete(recipeItems).where(eq(recipeItems.recipeId, recipeId))
        } else {
          // Create
          const [created] = await tx
            .insert(recipes)
            .values({
              materialId: data.materialId,
              productVariantId: data.productVariantId,
              targetQty: data.targetQty,
              instructions: data.instructions,
              ...metadata,
            })
            .returning({ id: recipes.id })

          recipeId = created!.id
        }

        // Insert new items
        if (data.items.length > 0) {
          await tx.insert(recipeItems).values(
            data.items.map((item) => ({
              recipeId,
              materialId: item.materialId,
              qty: item.qty,
              uom: item.uom,
              ...metadata,
            }))
          )
        }

        return { id: recipeId }
      })
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record('RecipeService.handleRemove', async () => {
      const result = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id })
      if (result.length === 0) throw err.notFound(id)

      return { id }
    })
  }
}
