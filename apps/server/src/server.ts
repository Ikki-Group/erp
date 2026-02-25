import { logger } from '@/lib/logger'

import 'zod-openapi'

import { configure, getConsoleSink } from '@logtape/logtape'

import { env } from '@/config/env'

async function main() {
  await configure({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      {
        category: ['logtape', 'meta'],
        sinks: ['console'],
        lowestLevel: 'warning',
      },
      {
        category: [],
        sinks: ['console'],
        lowestLevel: 'debug',
      },
    ],
  })

  const app = await import('@/app').then((mod) => mod.app)

  app.listen({
    port: env.PORT,
  })

  logger
    .withMetadata({
      port: env.PORT,
      host: env.HOST,
      env: env.NODE_ENV,
    })
    .info(`${env.APP_NAME} is running at http://${env.HOST}:${env.PORT}`)
}

main()

// async function shutdown() {
//   logger.info('Shutting down')

//   await server.stop()
//   await closeDatabase()
//   logger.info('Shutdown complete')

//   // eslint-disable-next-line unicorn/no-process-exit
//   process.exit(0)
// }

// process.on('SIGINT', shutdown)
// process.on('SIGTERM', shutdown)
