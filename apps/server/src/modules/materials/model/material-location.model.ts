import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import type { MaterialLocationDto } from '../dto'

const materialLocationSchema = new Schema<MaterialLocationDto>({
  materialId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: DB_NAME.MATERIAL,
  },
  locationId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: DB_NAME.LOCATION,
  },

  // Per-location configuration
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: null },
  reorderPoint: { type: Number, default: 0 },

  // Stock tracking
  stockStart: { type: Number, default: 0 },
  stockAdjustment: { type: Number, default: 0 },
  stockSell: { type: Number, default: 0 },
  stockPurchase: { type: Number, default: 0 },
  stockEnd: { type: Number, default: 0 },
}).add(MetadataSchema)

materialLocationSchema
  .index({ materialId: 1, locationId: 1 }, { name: 'material_location_idx', unique: true })
  .index({ locationId: 1 }, { name: 'locationId_idx' })
  .index({ materialId: 1 }, { name: 'materialId_idx' })

export const MaterialLocationModel = model(DB_NAME.MATERIAL_LOCATION, materialLocationSchema)
