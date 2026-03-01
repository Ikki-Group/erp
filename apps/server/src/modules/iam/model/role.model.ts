import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import type { RoleDto } from '../dto'

const roleSchema = new Schema<RoleDto>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  isSystem: { type: Boolean, default: false, required: true },
}).add(MetadataSchema)

roleSchema.index({ code: 1 }, { name: 'code_idx', unique: true }).index({ name: 1 }, { name: 'name_idx', unique: true })

export const RoleModel = model(DB_NAME.ROLE, roleSchema)
