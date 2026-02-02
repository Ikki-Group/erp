import { env } from '@/config/env'
import { closeDatabase } from '@/database'
import { logger } from '@/shared/logger'

import { app } from './app'

const server = app.listen({
  port: env.PORT,
  hostname: env.HOST,
})

logger
  .withMetadata({
    port: env.PORT,
    host: env.HOST,
    env: env.NODE_ENV,
  })
  .info(`${env.APP_NAME} is running at http://${env.HOST}:${env.PORT}`)

async function shutdown() {
  logger.info('Shutting down...')

  await server.stop()

  await closeDatabase()

  logger.info('Shutdown complete')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('beforeExit', shutdown)
