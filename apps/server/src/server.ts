// oxlint-disable-next-line import/no-unassigned-import
import '@total-typescript/ts-reset'
import { env } from '@/config/env'
import { logger } from '@/core/logger'

const app = await import('@/app').then((mod) => mod.app)

app.listen({ port: env.PORT })

logger.info(
	{ port: env.PORT, host: env.HOST, env: env.NODE_ENV },
	`${env.APP_NAME} is running at http://${env.HOST}:${env.PORT}`,
)

// async function shutdown() {
//   logger.info('Shutting down')

//   await server.stop()
//   await closeDatabase()
//   logger.info('Shutdown complete')

//   process.exit(0)
// }

// process.on('SIGINT', shutdown)
// process.on('SIGTERM', shutdown)
