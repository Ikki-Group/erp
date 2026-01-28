import { uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core"
import { dbSchema } from "../db-schema"

export const users = dbSchema.table("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),

  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),

  fullName: varchar("fullName", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),

  isActive: boolean("isActive").notNull().default(true),
  isDeleted: boolean("isDeleted").notNull().default(false),

  lastLoginAt: timestamp("lastLoginAt", { withTimezone: true }),
  deletedAt: timestamp("deletedAt", { withTimezone: true }),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
