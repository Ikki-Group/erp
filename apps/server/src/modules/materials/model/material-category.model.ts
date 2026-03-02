import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import type { MaterialCategoryDto } from '../dto'

const materialCategorySchema = new Schema<MaterialCategoryDto>({
  name: { type: String, required: true },
  description: { type: String },
}).add(MetadataSchema)

materialCategorySchema
  .index({ name: 1 }, { name: 'name_idx', unique: true })
  .index({ name: 'text' }, { name: 'search_idx' })

export const MaterialCategoryModel = model(DB_NAME.MATERIAL_CATEGORY, materialCategorySchema)
