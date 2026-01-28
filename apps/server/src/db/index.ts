import { drizzle } from "drizzle-orm/bun-sql"
import { config } from "@/core/config"
import { logger } from "@/utils/logger"
import { SQL } from "bun"
import * as schema from "./schema"

const client = new SQL(config.DATABASE_URL)
export const db = drizzle({ client, schema })

export async function closeDatabase() {
  logger.info("Closing database connections...")
  await client.end()
  logger.info("Database connections closed")
}

export type Database = typeof db
export { schema }
