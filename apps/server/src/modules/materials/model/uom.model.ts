import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import type { UomDto } from '../dto'

const uomSchema = new Schema<UomDto>({
  code: { type: String, required: true },
}).add(MetadataSchema)

uomSchema.index({ code: 1 }, { name: 'code_idx', unique: true }).index({ code: 'text' }, { name: 'search_idx' })

export const UomModel = model(DB_NAME.UOM, uomSchema)
