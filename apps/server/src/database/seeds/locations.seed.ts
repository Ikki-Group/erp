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
      code: 'IR',
      name: 'Ikki Resto',
      type: 'store',
      description: 'Ikki Resto',
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    },
    {
      code: 'IC',
      name: 'Ikki Coffee',
      type: 'store',
      description: 'Ikki Coffee',
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    },
    {
      code: 'w-01',
      name: 'Gudang Rumag',
      type: 'warehouse',
      description: 'Gudang Rumah',
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    },
  ]

  await db.insert(locations).values(defaultLocations)
  console.log('Locations seeded successfully.')
}
