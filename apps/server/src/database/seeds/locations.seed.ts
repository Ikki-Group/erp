import { db } from '../index'
import { locations } from '../schema'

export async function seedLocations() {
  console.log('Seeding locations...')

  const existingLocations = await db.select().from(locations)
  if (existingLocations.length > 0) {
    console.log('Locations already seeded, skipping.')
    return
  }

  const defaultLocations: (typeof locations.$inferInsert)[] = [
    {
      code: 'HO',
      name: 'Head Office',
      type: 'central_warehouse',
      description: 'Head Office Jakarta',
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    },
    {
      code: 'WH-01',
      name: 'Main Warehouse',
      type: 'warehouse',
      description: 'Main Distribution Center Bekasi',
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    },
  ]

  await db.insert(locations).values(defaultLocations)
  console.log('Locations seeded successfully.')
}
