import { app } from './app.ts'
import { getLogger, setupLogger } from './infra/logger/index.ts'
import { env } from './shared/config/env.ts'

const port = env.PORT

await setupLogger()

const logger = getLogger(['server'])

app.listen(port, () => {
	logger.info('Server running on port {port}', { port })
})

export type App = typeof app
