import { db } from '@/db'

import { env } from '@/config/env'
import { createCache } from '@/infra/cache'
import { logger } from '@/infra/logger'

import { createModules } from '@/modules/_registry'
import { createRoutes } from '@/modules/_routes'

import { createApp } from './app'

const cacheClient = createCache({ redisUrl: env.REDIS_URL })
const modules = createModules(db, cacheClient)
const routes = createRoutes(modules)

const app = createApp(modules)
routes.register(app)

app
	.onStart(() => {
		logger.info(`${env.APP_NAME} is running at http://${env.HOST}:${env.PORT}`, {
			port: env.PORT,
			host: env.HOST,
			env: env.NODE_ENV,
		})
	})
	.listen({ port: env.PORT, hostname: env.HOST })

async function shutdown() {
	logger.info('Shutting down')

	await app.stop()
	logger.info('Shutdown complete')

	process.exit(0)
}

// oxlint-disable-next-line typescript/no-misused-promises
process.on('SIGINT', shutdown)
// oxlint-disable-next-line typescript/no-misused-promises
process.on('SIGTERM', shutdown)
