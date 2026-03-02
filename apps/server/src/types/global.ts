import '@total-typescript/ts-reset'

import type { Types } from 'mongoose'

declare global {
  type ObjectId = Types.ObjectId

  type MaybePlural<T = unknown> = T | T[]
  type Maybe<T> = T | undefined | null
  type Nullish<T> = T | null | undefined

  type WithId<T extends object> = Omit<T, 'id'> & { id: ObjectId }
}
