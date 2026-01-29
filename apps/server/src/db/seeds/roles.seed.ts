import { db } from "../index"
import { roles } from "../schema"

export async function seedRoles() {
  console.log("Seeding roles...")

  const existingRoles = await db.select().from(roles)
  if (existingRoles.length > 0) {
    console.log("Roles already seeded, skipping.")
    return
  }

  const defaultRoles = [
    {
      code: "SUPERADMIN",
      name: "Super Administrator",
      description: "Full access to all modules and settings",
      permissionCodes: ["*"],
    },
    {
      code: "ADMIN",
      name: "Administrator",
      description: "Can manage most system features",
      permissionCodes: ["dashboard.*", "inventory.*", "sales.*", "iam.*"],
    },
    {
      code: "STAFF",
      name: "Staff",
      description: "Regular staff access",
      permissionCodes: ["dashboard.read", "inventory.read", "sales.read"],
    },
  ]

  await db.insert(roles).values(defaultRoles)
  console.log("Roles seeded successfully.")
}
