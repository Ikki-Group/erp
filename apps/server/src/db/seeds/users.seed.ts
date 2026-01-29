import { db } from "../index"
import { users, roles, userRoleAssignments } from "../schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt"

export async function seedUsers() {
  console.log("Seeding users...")

  const existingUsers = await db.select().from(users)
  if (existingUsers.length > 0) {
    console.log("Users already seeded, skipping.")
    return
  }

  // Hash password
  const passwordHash = await bcrypt.hash("admin123", 10)

  // 1. Create Superadmin User
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "superadmin",
      email: "admin@ikki.dev",
      passwordHash: passwordHash,
      fullName: "Super Administrator",
      displayName: "Superadmin",
      isActive: true,
    })
    .returning()

  // 2. Get Superadmin Role
  const [superAdminRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.code, "SUPERADMIN"))
    .limit(1)

  if (adminUser && superAdminRole) {
    // 3. Assign Role to User
    await db.insert(userRoleAssignments).values({
      userId: adminUser.id,
      roleId: superAdminRole.id,
      locationId: null, // Global role
    })
    console.log("Superadmin user created and role assigned.")
  }

  console.log("Users seeded successfully.")
}
