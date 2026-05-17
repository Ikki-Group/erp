import { createCache } from '@/core/cache'
import { logger } from '@/core/logger'

import { env } from '@/config/env'

import { createModules } from '@/modules/_registry'
import { createRoutes } from '@/modules/_routes'

import { db } from './db'
import { createApp } from '@/app'

const cacheClient = createCache()
const modules = createModules(db, cacheClient)
const routes = createRoutes(modules)

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
