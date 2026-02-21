import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'

import { db } from '../index'
import { locations, roles, userAssignments, users } from '../schema'

export async function seedUsers() {
  console.log('Seeding users...')

  const existingUsers = await db.select().from(users)
  if (existingUsers.length > 0) {
    console.log('Users already seeded, skipping.')
    return
  }

  // Hash password
  const passwordHash = await bcrypt.hash('admin123', 10)

  // 1. Create Superadmin User
  const [adminUser] = await db
    .insert(users)
    .values({
      username: 'superadmin',
      email: 'admin@ikki.dev',
      passwordHash: passwordHash,
      fullname: 'Super Administrator',
      isActive: true,
      isRoot: true,
      createdBy: 1,
      updatedBy: 1,
    })
    .returning()

  // 2. Get Superadmin Role and HO Location
  const [superAdminRole] = await db.select().from(roles).where(eq(roles.code, 'SUPERADMIN')).limit(1)
  const [hoLocation] = await db.select().from(locations).where(eq(locations.code, 'HO')).limit(1)

  if (adminUser && superAdminRole && hoLocation) {
    // 3. Assign Role to User at HO Location
    await db.insert(userAssignments).values({
      userId: adminUser.id,
      roleId: superAdminRole.id,
      locationId: hoLocation.id,
      isDefault: false,
    })
    console.log('Superadmin user created and role assigned.')
  }

  console.log('Users seeded successfully.')
}
