import { model, Schema } from 'mongoose'

import { DB_NAME } from '@/config/db-name'

import type { SessionDto } from '../dto'

const sessionSchema = new Schema<SessionDto>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: DB_NAME.USER },
  createdAt: { type: Date, required: true, default: Date.now },
  expiredAt: { type: Date, required: true },
})

export const SessionModel = model(DB_NAME.SESSION, sessionSchema)
