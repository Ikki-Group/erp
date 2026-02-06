import { integer, timestamp } from 'drizzle-orm/pg-core'

export const metafields = {
  createdAt: timestamp().defaultNow().notNull(),
  createdBy: integer().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  updatedBy: integer().notNull(),
}

export const softDeleteMetafields = {
  deletedAt: timestamp(),
}

// Type exports
export interface MetaFields {
  createdAt: Date
  createdBy: number
  updatedAt: Date
  updatedBy: number
}

export interface SoftDeleteFields {
  deletedAt: Date | null
}
