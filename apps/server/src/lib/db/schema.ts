import { Schema } from 'mongoose'

import { DB_NAME } from '@/config/db-name'

export const MetadataSchema = new Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  createdBy: {
    ref: DB_NAME.USER,
    type: Schema.Types.ObjectId,
    required: true,
  },
  updatedBy: {
    ref: DB_NAME.USER,
    type: Schema.Types.ObjectId,
    required: true,
  },
  syncAt: { type: Date, default: undefined, required: false },
})
