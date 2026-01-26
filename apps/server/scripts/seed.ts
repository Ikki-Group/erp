import { db, closeDatabase } from "@/db"
import { users } from "@/db/schema"
import { logger } from "@/utils/logger"
import { exit } from "process"

async function seed() {
  try {
    const email = "admin@example.com"
    const password = "password123"
    const name = "Admin User"

    logger.info("Seeding user...")

    const passwordHash = await Bun.password.hash(password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    })

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash,
          name,
          updatedAt: new Date(),
        },
      })
      .returning()

    logger.info({ userId: user!.id }, "User seeded successfully")
  } catch (err) {
    logger.error({ err }, "Failed to seed user")
    exit(1)
  } finally {
    await closeDatabase()
  }
}

seed()
