import { db } from '../index'
import { roles } from '../schema'

export async function seedRoles() {
  console.log('Seeding roles...')

  const existingRoles = await db.select().from(roles)
  if (existingRoles.length > 0) {
    console.log('Roles already seeded, skipping.')
    return
  }

  const defaultRoles: (typeof roles.$inferInsert)[] = [
    {
      code: 'SUPERADMIN',
      name: 'Super Administrator',
      isSystem: true,
      createdBy: 1,
      updatedBy: 1,
    },
    {
      code: 'ADMIN',
      name: 'Administrator',
      isSystem: true,
      createdBy: 1,
      updatedBy: 1,
    },
    {
      code: 'STAFF',
      name: 'Staff',
      isSystem: true,
      createdBy: 1,
      updatedBy: 1,
    },
  ]

  await db.insert(roles).values(defaultRoles)
  console.log('Roles seeded successfully.')
}
