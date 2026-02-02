import { closeDatabase } from '../src/database'
import { runAllSeeds } from '../src/database/seeds'

async function main() {
  try {
    await runAllSeeds()
    await closeDatabase()
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:')
    console.error(error)
    await closeDatabase()
    process.exit(1)
  }
}

main()
