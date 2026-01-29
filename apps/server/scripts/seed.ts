import { runAllSeeds } from "../src/db/seeds"
import { closeDatabase } from "../src/db"

async function main() {
  try {
    await runAllSeeds()
    await closeDatabase()
    process.exit(0)
  } catch (error) {
    console.error("Seeding failed:")
    console.error(error)
    await closeDatabase()
    process.exit(1)
  }
}

main()
