// oxlint-disable import/no-unassigned-import

import '@/core/otel'
import { logger } from '@/core/logger'

import { initModules } from '@/modules/_registry'
import { initRoutes } from '@/modules/_routes'

import { initDb } from './db'
import { createApp } from '@/app'
import { env } from '@/config/env'

const db = initDb(env.DATABASE_URL)
const modules = initModules(db)
const routes = initRoutes(modules)

const app = createApp(modules)
routes.register(app)

app.listen({ port: env.PORT })

logger.info(`${env.APP_NAME} is running at http://${env.HOST}:${env.PORT}`, {
	port: env.PORT,
	host: env.HOST,
	env: env.NODE_ENV,
})

// async function shutdown() {
//   logger.info('Shutting down')

//   await server.stop()
//   await closeDatabase()
//   logger.info('Shutdown complete')

//   process.exit(0)
// }

// process.on('SIGINT', shutdown)
// process.on('SIGTERM', shutdown)
