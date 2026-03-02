import '@total-typescript/ts-reset'

import type { Types } from 'mongoose'

declare global {
  type ObjectId = Types.ObjectId
}
