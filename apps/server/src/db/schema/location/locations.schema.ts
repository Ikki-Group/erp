import { uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core"
import { dbSchema } from "../db-schema"

export const locations = dbSchema.table("locations", {
  id: uuid("id").defaultRandom().primaryKey(),

  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),

  type: varchar("type", { length: 50 }).notNull(),

  // Additional fields for better UX
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),

  isActive: boolean("isActive").notNull().default(true),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
