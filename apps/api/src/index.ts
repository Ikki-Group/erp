import { config } from "@/core/config"
import { closeDatabase } from "@/db"
import { logger } from "@/utils/logger"
import { app } from "./app"

/**
 * Start the server
 */
const server = app.listen({
  port: config.PORT,
  hostname: config.HOST,
})

logger.info(
  { port: config.PORT, host: config.HOST, env: config.NODE_ENV },
  `🚀 ${config.APP_NAME} is running`,
)

console.log(
  `Server is running at http://${server.server?.hostname}:${server.server?.port}`,
)

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.info("Shutting down...")

  await server.stop()
  await closeDatabase()

  logger.info("Shutdown complete")
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
process.on("beforeExit", shutdown)
