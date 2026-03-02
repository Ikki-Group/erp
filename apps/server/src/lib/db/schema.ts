import { Schema } from 'mongoose'

import { DB_NAME } from '@/config/db-name'

/**
 * Shared metadata schema for all collections.
 *
 * Note: `createdAt` and `updatedAt` are managed manually (not via Mongoose's built-in `timestamps`)
 * so they can be explicitly controlled by the service layer (e.g. preserving `updatedAt` on no-op updates).
 */
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
  syncAt: { type: Date },
})
