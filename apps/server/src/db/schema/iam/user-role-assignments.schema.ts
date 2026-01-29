import { uuid, timestamp, uniqueIndex, serial } from "drizzle-orm/pg-core"
import { users } from "./users.schema"
import { roles } from "./roles.schema"
import { locations } from "../location/locations.schema"
import { dbSchema } from "../db-schema"

export const userRoleAssignments = dbSchema.table(
  "userRoleAssignments",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    /**
     * locationId NULL = GLOBAL ROLE
     */
    locationId: uuid().references(() => locations.id, {
      onDelete: "cascade",
    }),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_user_role_location").on(t.userId, t.roleId, t.locationId),
  ],
)
