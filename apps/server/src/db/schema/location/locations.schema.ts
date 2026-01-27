import { uuid, varchar, timestamp } from "drizzle-orm/pg-core"
import { dbSchema } from "../db-schema"

export const locations = dbSchema.table("locations", {
  id: uuid("id").defaultRandom().primaryKey(),

  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),

  type: varchar("type", { length: 50 }).notNull(),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
