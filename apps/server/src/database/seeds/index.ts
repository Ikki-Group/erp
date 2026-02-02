import { seedLocations } from './locations.seed'
import { seedRoles } from './roles.seed'
import { seedUsers } from './users.seed'

export async function runAllSeeds() {
  console.log('Starting database seeding...')

  try {
    await seedRoles()
    await seedLocations()
    await seedUsers()

    console.log('Database seeding completed successfully.')
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  }
}
