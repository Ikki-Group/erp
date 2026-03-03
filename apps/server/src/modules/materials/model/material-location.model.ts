import { model, Schema } from 'mongoose'

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
  assignedAt: { type: Date, required: true },
  assignedBy: { type: Schema.Types.ObjectId, required: true, ref: DB_NAME.USER },
})

materialLocationSchema.index({ materialId: 1, locationId: 1 }, { unique: true })

export const MaterialLocationModel = model(DB_NAME.MATERIAL_LOCATION, materialLocationSchema)
