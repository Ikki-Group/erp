import { varchar, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core"
import { dbSchema } from "../db-schema"

export const roles = dbSchema.table("roles", {
  id: uuid().primaryKey().defaultRandom(),

  code: varchar({ length: 100 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),

  /**
   * permissionCodes di-validate di runtime
   * contoh:
   * ['inventory.read', 'sales.create']
   * ['*'] → SUPERADMIN
   */
  permissionCodes: jsonb().$type<string[]>().notNull(),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
