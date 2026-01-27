import { uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { dbSchema } from "../db-schema"

export const roles = dbSchema.table("roles", {
  id: uuid("id").defaultRandom().primaryKey(),

  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  /**
   * permissionCodes di-validate di runtime
   * contoh:
   * ['inventory.read', 'sales.create']
   * ['*'] → SUPERADMIN
   */
  permissionCodes: jsonb("permissionCodes").$type<string[]>().notNull(),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
