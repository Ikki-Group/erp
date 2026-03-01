import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import type { UserAssignmentDto, UserDto } from '../dto'

const userSchema = new Schema<UserDto>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  passwordHash: { type: String, required: true },
  isRoot: { type: Boolean, default: false, required: true },
  isActive: { type: Boolean, default: true, required: true },
  assignments: {
    type: [
      new Schema<UserAssignmentDto>({
        locationId: { type: Schema.Types.ObjectId, required: true },
        roleId: { type: Schema.Types.ObjectId, required: true },
        isDefault: { type: Boolean, default: false, required: true },
      }),
    ],
    default: [],
  },
}).add(MetadataSchema)

userSchema
  .index({ email: 1 }, { name: 'email_idx', unique: true })
  .index({ username: 1 }, { name: 'username_idx', unique: true })
  .index({ _id: 1, 'assignments.roleId': 1 }, { name: 'role_idx', unique: true })

export const UserModel = model(DB_NAME.USER, userSchema)
