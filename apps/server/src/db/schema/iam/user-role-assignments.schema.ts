import { uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { users } from "./users.schema"
import { roles } from "./roles.schema"
import { locations } from "../location/locations.schema"
import { dbSchema } from "../db-schema"

export const userRoleAssignments = dbSchema.table(
  "userRoleAssignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    roleId: uuid("roleId")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    /**
     * locationId NULL = GLOBAL ROLE
     */
    locationId: uuid("locationId").references(() => locations.id, {
      onDelete: "cascade",
    }),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_user_role_location").on(t.userId, t.roleId, t.locationId),
  ],
)
