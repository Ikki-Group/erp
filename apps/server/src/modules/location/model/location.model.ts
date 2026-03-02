import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import { LocationType, type LocationDto } from '../dto'

const locationSchema = new Schema<LocationDto>({
  code: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: LocationType.options, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true, required: true },
}).add(MetadataSchema)

locationSchema
  .index({ code: 1 }, { name: 'code_idx', unique: true })
  .index({ name: 1 }, { name: 'name_idx', unique: true })
  .index({ type: 1 }, { name: 'type_idx' })
  .index({ isActive: 1 }, { name: 'isActive_idx' })
  .index({ code: 'text', name: 'text' }, { name: 'search_idx' })

export const LocationModel = model(DB_NAME.LOCATION, locationSchema)
