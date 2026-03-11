import { and, eq } from 'drizzle-orm'

import { productCategoriesTable, productExternalMappingsTable, productsTable, productVariantsTable } from '@/db/schema'

import { stampCreate, takeFirst } from '@/core/database'
import { db } from '@/db'

import type { MokaCategoryRaw } from './engine/moka-category.service'
import type { MokaProductRaw } from './engine/moka-product.service'

export class MokaTransformationService {
  async transformCategories(_locationId: number, categories: MokaCategoryRaw[], actorId: number) {
    for (const cat of categories) {
      const result = await db.select().from(productCategoriesTable).where(eq(productCategoriesTable.name, cat.name))
      const existing = takeFirst(result)

      if (!existing) {
        await db.insert(productCategoriesTable).values({
          name: cat.name,
          ...stampCreate(actorId),
        })
      }
    }
  }

  async transformProducts(locationId: number, products: MokaProductRaw[], actorId: number) {
    for (const prod of products) {
      const result = await db
        .select()
        .from(productExternalMappingsTable)
        .where(
          and(
            eq(productExternalMappingsTable.provider, 'moka'),
            eq(productExternalMappingsTable.externalId, String(prod.id))
          )
        )
      const mapping = takeFirst(result)

      if (mapping) {
        await db
          .update(productExternalMappingsTable)
          .set({
            lastSyncedAt: new Date(),
            externalData: prod,
          })
          .where(eq(productExternalMappingsTable.id, mapping.id))
      } else {
        const [newProd] = await db
          .insert(productsTable)
          .values({
            name: prod.name,
            sku: prod.item_variants[0]?.sku || `MOKA-${prod.id}`,
            locationId,
            status: 'active',
            basePrice: String(prod.item_variants[0]?.price || 0),
            hasVariants: prod.item_variants.length > 1,
            ...stampCreate(actorId),
          })
          .returning({ id: productsTable.id })

        if (newProd) {
          await db.insert(productExternalMappingsTable).values({
            productId: newProd.id,
            provider: 'moka',
            externalId: String(prod.id),
            externalData: prod,
            lastSyncedAt: new Date(),
            ...stampCreate(actorId),
          })

          if (prod.item_variants.length > 1) {
            for (const v of prod.item_variants) {
              await db.insert(productVariantsTable).values({
                productId: newProd.id,
                name: v.name,
                sku: v.sku,
                basePrice: String(v.price),
                isDefault: false,
                ...stampCreate(actorId),
              })
            }
          }
        }
      }
    }
  }
}
