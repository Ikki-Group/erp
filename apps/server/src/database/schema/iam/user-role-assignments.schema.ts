import { timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { dbSchema } from '../db-schema'
import { locations } from '../location/locations.schema'
import { roles } from './roles.schema'
import { users } from './users.schema'

/**
 * User Role Assignments Table
 *
 * Manages the assignment of roles to users, optionally scoped to specific locations.
 *
 * Features:
 * - Many-to-many relationship between users and roles
 * - Location-based role scoping (optional)
 * - Supports multi-location access control
 *
 * Examples:
 * - User A has role "Warehouse Manager" at Location "Warehouse Jakarta"
 * - User B has role "Admin" (no location = global access)
 */
export const userRoleAssignments = dbSchema.table(
  'user_role_assignments',
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),

    /** locationId NULL = GLOBAL ROLE*/
    locationId: uuid().references(() => locations.id, {
      onDelete: 'cascade',
    }),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_user_role_location').on(t.userId, t.roleId, t.locationId)]
)
