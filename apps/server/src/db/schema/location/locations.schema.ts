import { varchar, timestamp, boolean, text, uuid } from "drizzle-orm/pg-core"
import { dbSchema } from "../db-schema"

export const locations = dbSchema.table("locations", {
  id: uuid().primaryKey().defaultRandom(),

  code: varchar({ length: 50 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 50 }).notNull(),

  address: text(),
  city: varchar({ length: 100 }),
  province: varchar({ length: 100 }),
  postalCode: varchar({ length: 20 }),
  phone: varchar({ length: 50 }),
  email: varchar({ length: 255 }),

  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
