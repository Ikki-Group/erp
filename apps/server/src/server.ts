import { env } from '@/config/env'
import { logger } from '@/core/logger'

async function main() {
  const app = await import('@/app').then((mod) => mod.app)

  app.listen({ port: env.PORT })

  logger.info(
    { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
    `${env.APP_NAME} is running at http://${env.HOST}:${env.PORT}`,
  )
}

// oxlint-disable-next-line typescript/no-floating-promises
main()

// async function shutdown() {
//   logger.info('Shutting down')

//   await server.stop()
//   await closeDatabase()
//   logger.info('Shutdown complete')

//   process.exit(0)
// }

// process.on('SIGINT', shutdown)
// process.on('SIGTERM', shutdown)
