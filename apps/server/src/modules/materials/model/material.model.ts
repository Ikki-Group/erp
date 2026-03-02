import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import { MaterialType, type MaterialConversionDto, type MaterialDto } from '../dto'

const materialSchema = new Schema<MaterialDto>({
  name: { type: String, required: true },
  description: { type: String },
  sku: { type: String, required: true },
  type: { type: String, enum: MaterialType.options, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: DB_NAME.MATERIAL_CATEGORY },
  baseUom: { type: String, required: true },
  locationIds: { type: [Schema.Types.ObjectId], required: true, ref: DB_NAME.LOCATION },
  conversions: {
    type: [
      new Schema<MaterialConversionDto>({
        factor: { type: String, required: true },
        uom: { type: String, required: true },
      }),
    ],
    default: [],
  },
}).add(MetadataSchema)

materialSchema
  .index({ name: 1 }, { name: 'name_idx', unique: true })
  .index({ sku: 1 }, { name: 'sku_idx', unique: true })
  .index({ type: 1 }, { name: 'type_idx' })
  .index({ _id: 1, 'conversions.uomId': 1 }, { name: 'conversionsUomId_idx', unique: true })
  .index({ categoryId: 1 }, { name: 'categoryId_idx' })
  .index({ locationIds: 1 }, { name: 'locationIds_idx' })
  .index({ name: 'text', sku: 'text' }, { name: 'search_idx' })

export const MaterialModel = model(DB_NAME.MATERIAL, materialSchema)
