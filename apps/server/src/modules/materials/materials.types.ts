import { zSchema } from '@server/lib/zod'
import z from 'zod'

/**
 * Materials Module Schema Definitions
 * Zod schemas for materials entities used in API validation and responses
 */
export namespace MaterialsSchema {
  /**
   * Material Category
   */
  export const MaterialCategory = z.object({
    id: zSchema.num,
    code: zSchema.str,
    name: zSchema.str,
    description: z.string().nullable(),
    isActive: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type MaterialCategory = z.infer<typeof MaterialCategory>

  /**
   * Material Category Info (Subset)
   */
  export const MaterialCategoryInfo = z.object({
    id: zSchema.num,
    code: zSchema.str,
    name: zSchema.str,
  })

  export type MaterialCategoryInfo = z.infer<typeof MaterialCategoryInfo>

  /**
   * Unit of Measure (UOM)
   */
  export const Uom = z.object({
    id: zSchema.num,
    code: zSchema.str,
    name: zSchema.str,
    symbol: zSchema.str,
    isActive: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type Uom = z.infer<typeof Uom>

  /**
   * UOM Info (Subset)
   */
  export const UomInfo = z.object({
    id: zSchema.num,
    code: zSchema.str,
    name: zSchema.str,
    symbol: zSchema.str,
  })

  export type UomInfo = z.infer<typeof UomInfo>

  /**
   * UOM Conversion
   */
  export const UomConversion = z.object({
    id: zSchema.num,
    fromUomId: zSchema.num,
    toUomId: zSchema.num,
    conversionFactor: zSchema.str, // decimal as string
    ...zSchema.meta.shape,
  })

  export type UomConversion = z.infer<typeof UomConversion>

  /**
   * UOM Conversion with related UOM details
   */
  export const UomConversionDetail = UomConversion.extend({
    fromUom: Uom.nullable(),
    toUom: Uom.nullable(),
  })

  export type UomConversionDetail = z.infer<typeof UomConversionDetail>

  /**
   * Material
   */
  export const Material = z.object({
    id: zSchema.num,
    sku: zSchema.str,
    name: zSchema.str,
    description: z.string().nullable(),
    type: z.enum(['raw', 'semi']),
    categoryId: zSchema.num.nullable(),
    isActive: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type Material = z.infer<typeof Material>

  /**
   * Material Info (Subset)
   */
  export const MaterialInfo = z.object({
    id: zSchema.num,
    sku: zSchema.str,
    name: zSchema.str,
    type: z.enum(['raw', 'semi']),
  })

  export type MaterialInfo = z.infer<typeof MaterialInfo>

  /**
   * Material with category details
   */
  export const MaterialDetail = Material.extend({
    category: MaterialCategoryInfo.nullable().optional(),
  })

  export type MaterialDetail = z.infer<typeof MaterialDetail>

  /**
   * Material Unit
   */
  export const MaterialUnit = z.object({
    id: zSchema.num,
    materialId: zSchema.num,
    uomId: zSchema.num,
    isBaseUnit: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type MaterialUnit = z.infer<typeof MaterialUnit>

  /**
   * Material Unit with UOM details
   */
  export const MaterialUnitDetail = MaterialUnit.extend({
    uom: UomInfo.nullable().optional(),
  })

  export type MaterialUnitDetail = z.infer<typeof MaterialUnitDetail>

  /**
   * Location Material
   */
  export const LocationMaterial = z.object({
    id: zSchema.num,
    locationId: zSchema.num,
    materialId: zSchema.num,
    stockAlertThreshold: zSchema.str.nullable(), // decimal as string
    weightedAvgCost: zSchema.str.nullable(), // decimal as string
    isActive: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type LocationMaterial = z.infer<typeof LocationMaterial>

  /**
   * Location Material with related details
   */
  export const LocationMaterialDetail = LocationMaterial.extend({
    material: MaterialInfo.nullable().optional(),
    location: z
      .object({
        id: zSchema.num,
        code: zSchema.str,
        name: zSchema.str,
        type: z.enum(['store', 'warehouse', 'central_warehouse']),
      })
      .nullable()
      .optional(),
  })

  export type LocationMaterialDetail = z.infer<typeof LocationMaterialDetail>
}

/**
 * Request Schemas for API endpoints
 */
export namespace MaterialsRequest {
  /**
   * Create Material Category
   */
  export const CreateMaterialCategory = z.object({
    code: zSchema.str,
    name: zSchema.str,
    description: zSchema.str.optional(),
  })

  export type CreateMaterialCategory = z.infer<typeof CreateMaterialCategory>

  /**
   * Update Material Category
   */
  export const UpdateMaterialCategory = z.object({
    code: zSchema.str.optional(),
    name: zSchema.str.optional(),
    description: zSchema.str.optional(),
    isActive: zSchema.bool.optional(),
  })

  export type UpdateMaterialCategory = z.infer<typeof UpdateMaterialCategory>

  /**
   * Create UOM
   */
  export const CreateUom = z.object({
    code: zSchema.str,
    name: zSchema.str,
    symbol: zSchema.str,
  })

  export type CreateUom = z.infer<typeof CreateUom>

  /**
   * Update UOM
   */
  export const UpdateUom = z.object({
    code: zSchema.str.optional(),
    name: zSchema.str.optional(),
    symbol: zSchema.str.optional(),
    isActive: zSchema.bool.optional(),
  })

  export type UpdateUom = z.infer<typeof UpdateUom>

  /**
   * Create UOM Conversion
   */
  export const CreateUomConversion = z.object({
    fromUomId: zSchema.num,
    toUomId: zSchema.num,
    conversionFactor: zSchema.str, // decimal as string
  })

  export type CreateUomConversion = z.infer<typeof CreateUomConversion>

  /**
   * Update UOM Conversion
   */
  export const UpdateUomConversion = z.object({
    conversionFactor: zSchema.str, // decimal as string
  })

  export type UpdateUomConversion = z.infer<typeof UpdateUomConversion>

  /**
   * Create Material
   */
  export const CreateMaterial = z.object({
    sku: zSchema.str.optional(), // auto-generate if not provided
    name: zSchema.str,
    description: zSchema.str.optional(),
    type: z.enum(['raw', 'semi']),
    categoryId: zSchema.num.optional(),
  })

  export type CreateMaterial = z.infer<typeof CreateMaterial>

  /**
   * Update Material
   */
  export const UpdateMaterial = z.object({
    sku: zSchema.str.optional(),
    name: zSchema.str.optional(),
    description: zSchema.str.optional(),
    type: z.enum(['raw', 'semi']).optional(),
    categoryId: zSchema.num.nullable().optional(),
    isActive: zSchema.bool.optional(),
  })

  export type UpdateMaterial = z.infer<typeof UpdateMaterial>

  /**
   * Assign UOM to Material
   */
  export const AssignMaterialUom = z.object({
    uomId: zSchema.num,
    isBaseUnit: zSchema.bool.default(false),
  })

  export type AssignMaterialUom = z.infer<typeof AssignMaterialUom>

  /**
   * Bulk Assign Materials to Locations
   */
  export const BulkAssignLocationMaterials = z.object({
    materialIds: z.array(zSchema.num).min(1),
    locationIds: z.array(zSchema.num).min(1),
  })

  export type BulkAssignLocationMaterials = z.infer<typeof BulkAssignLocationMaterials>

  /**
   * Update Location Material Config
   */
  export const UpdateLocationMaterial = z.object({
    stockAlertThreshold: zSchema.str.optional(), // decimal as string
    weightedAvgCost: zSchema.str.optional(), // decimal as string
    isActive: zSchema.bool.optional(),
  })

  export type UpdateLocationMaterial = z.infer<typeof UpdateLocationMaterial>
}

// Export commonly used schemas
export const MaterialCategorySchema = MaterialsSchema.MaterialCategory
export const UomSchema = MaterialsSchema.Uom
export const UomConversionSchema = MaterialsSchema.UomConversion
export const MaterialSchema = MaterialsSchema.Material
export const MaterialUnitSchema = MaterialsSchema.MaterialUnit
export const LocationMaterialSchema = MaterialsSchema.LocationMaterial

// Test
