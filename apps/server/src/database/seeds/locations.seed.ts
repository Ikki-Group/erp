import { db } from '../index'
import { locations } from '../schema'

export async function seedLocations() {
  console.log('Seeding locations...')

  const existingLocations = await db.select().from(locations)
  if (existingLocations.length > 0) {
    console.log('Locations already seeded, skipping.')
    return
  }

  const defaultLocations = [
    {
      code: 'HO',
      name: 'Head Office',
      type: 'OFFICE',
      address: 'Jl. Sudirman No. 1',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      isActive: true,
    },
    {
      code: 'WH-01',
      name: 'Main Warehouse',
      type: 'WAREHOUSE',
      address: 'Jl. Industri No. 5',
      city: 'Bekasi',
      province: 'Jawa Barat',
      isActive: true,
    },
  ]

  await db.insert(locations).values(defaultLocations)
  console.log('Locations seeded successfully.')
}
