import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/**
 * Inventory Module Schema Definitions
 * Zod schemas for inventory entities used in API validation and responses
 */
export namespace InventorySchema {
  /**
   * Item Category
   */
  export const ItemCategory = z.object({
    id: zPrimitive.numCoerce,
    name: z.string(),
    description: z.string().nullable(),
    ...zSchema.meta.shape,
  })

  export type ItemCategory = z.infer<typeof ItemCategory>

  /**
   * Item Category Info (Subset)
   */
  export const ItemCategoryInfo = z.object({
    id: zPrimitive.numCoerce,
    name: z.string(),
  })

  export type ItemCategoryInfo = z.infer<typeof ItemCategoryInfo>

  /**
   * Item
   */
  export const Item = z.object({
    id: zPrimitive.numCoerce,
    name: z.string(),
    description: z.string().nullable(),
    type: z.enum(['raw', 'semi']),
    baseUnit: z.string(),
    categoryId: zPrimitive.numCoerce,
    ...zSchema.meta.shape,
  })

  export type Item = z.infer<typeof Item>

  /**
   * Item Info (Subset)
   */
  export const ItemInfo = z.object({
    id: zPrimitive.numCoerce,
    name: z.string(),
    type: z.enum(['raw', 'semi']),
    baseUnit: z.string(),
  })

  export type ItemInfo = z.infer<typeof ItemInfo>

  /**
   * Item with category details
   */
  export const ItemDetail = Item.extend({
    category: ItemCategoryInfo.nullable().optional(),
  })

  export type ItemDetail = z.infer<typeof ItemDetail>

  /**
   * Item Unit Conversion
   */
  export const ItemUnitConversion = z.object({
    id: zPrimitive.numCoerce,
    itemId: zPrimitive.numCoerce,
    fromUnit: z.string(),
    toUnit: z.string(),
    multiplier: z.string(),
  })

  export type ItemUnitConversion = z.infer<typeof ItemUnitConversion>

  /**
   * Item Location
   */
  export const ItemLocation = z.object({
    id: zPrimitive.numCoerce,
    itemId: zPrimitive.numCoerce,
    locationId: zPrimitive.numCoerce,
    isAssigned: z.boolean(),
    stockAlertLevel: zPrimitive.numCoerce,
    allowNegativeStock: z.boolean(),
    ...zSchema.meta.shape,
  })

  export type ItemLocation = z.infer<typeof ItemLocation>

  /**
   * Item Location with related details
   */
  export const ItemLocationDetail = ItemLocation.extend({
    item: ItemInfo.nullable().optional(),
    location: z
      .object({
        id: zPrimitive.numCoerce,
        code: z.string(),
        name: z.string(),
        type: z.enum(['store', 'warehouse']),
      })
      .nullable()
      .optional(),
  })

  export type ItemLocationDetail = z.infer<typeof ItemLocationDetail>
}

/**
 * Request Schemas for API endpoints
 */
export namespace InventoryRequest {
  /**
   * Create Item Category
   */
  export const CreateItemCategory = z.object({
    name: z.string(),
    description: z.string().optional(),
  })

  export type CreateItemCategory = z.infer<typeof CreateItemCategory>

  /**
   * Update Item Category
   */
  export const UpdateItemCategory = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  })

  export type UpdateItemCategory = z.infer<typeof UpdateItemCategory>

  /**
   * Create Item
   */
  export const CreateItem = z.object({
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(['raw', 'semi']),
    baseUnit: z.string(),
    categoryId: zPrimitive.numCoerce,
  })

  export type CreateItem = z.infer<typeof CreateItem>

  /**
   * Update Item
   */
  export const UpdateItem = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['raw', 'semi']).optional(),
    baseUnit: z.string().optional(),
    categoryId: zPrimitive.numCoerce.optional(),
  })

  export type UpdateItem = z.infer<typeof UpdateItem>

  /**
   * Create Unit Conversion
   */
  export const CreateUnitConversion = z.object({
    itemId: zPrimitive.numCoerce,
    fromUnit: z.string(),
    toUnit: z.string(),
    multiplier: z.string(),
  })

  export type CreateUnitConversion = z.infer<typeof CreateUnitConversion>

  /**
   * Bulk Assign Items to Locations
   */
  export const BulkAssignItemLocations = z.object({
    itemIds: z.array(zPrimitive.numCoerce).min(1),
    locationIds: z.array(zPrimitive.numCoerce).min(1),
  })

  export type BulkAssignItemLocations = z.infer<typeof BulkAssignItemLocations>

  /**
   * Update Item Location Config
   */
  export const UpdateItemLocation = z.object({
    isAssigned: z.boolean().optional(),
    stockAlertLevel: zPrimitive.numCoerce.optional(),
    allowNegativeStock: z.boolean().optional(),
  })

  export type UpdateItemLocation = z.infer<typeof UpdateItemLocation>
}

// Export commonly used schemas
export const ItemCategorySchema = InventorySchema.ItemCategory
export const ItemSchema = InventorySchema.Item
export const ItemUnitConversionSchema = InventorySchema.ItemUnitConversion
export const ItemLocationSchema = InventorySchema.ItemLocation
